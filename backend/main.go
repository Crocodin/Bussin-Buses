package main

import (
	"errors"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"bussin-buses/db"
	"bussin-buses/domain"
	auth "bussin-buses/jwt"
	"bussin-buses/repository"
	"bussin-buses/ws"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type registerRequest struct {
	Username string `json:"username" binding:"required,min=3,max=30"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=72"` // bcrypt ignores anything past 72 bytes
}

type loginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func main() {
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	if len(jwtSecret) == 0 {
		log.Println("WARNING: JWT_SECRET not set, using an insecure dev secret")
		jwtSecret = []byte("dev-only-secret-change-me")
	} // $env:JWT_SECRET = "Vfpd2kWVm0S9xI68PQObzCF2mWp2UEKi2lLSQoYC9Jk"

	database, err := db.Open("bussin.db")
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	busRepo := repository.NewSQLiteBusRepository(database)
	userRepo := repository.NewSQLiteUserRepository(database)

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:8100"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}))
	router.Static("/uploads", "./uploads")

	hub := ws.NewHub()
	router.GET("/ws", hub.Handle)

	/// ------------ GET
	router.GET("/buses", func(c *gin.Context) {
		buses, err := busRepo.List()
		if err != nil {
			log.Println("list buses:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		c.JSON(http.StatusOK, buses)
	})

	router.GET("/buses/:id", func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid bus id"})
			return
		}

		bus, err := busRepo.GetByID(id)
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "bus not found"})
			return
		}
		if err != nil {
			log.Println("get bus:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		c.JSON(http.StatusOK, bus)
	})

	/// ------------ POST
	router.POST("/buses", func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxFiles*maxFileSize)

		name := strings.TrimSpace(c.PostForm("name"))
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
			return
		}

		form, err := c.MultipartForm()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form or request too large"})
			return
		}

		files := form.File["images"]
		if len(files) == 0 || len(files) > maxFiles {
			c.JSON(http.StatusBadRequest, gin.H{"error": "send between 1 and 10 images"})
			return
		}

		var filenames []string
		removeSaved := func() { // undo the disk writes if anything fails later
			for _, f := range filenames {
				os.Remove(filepath.Join("uploads", f))
			}
		}

		urls := []string{}
		for _, fh := range files {
			if fh.Size > maxFileSize {
				removeSaved()
				c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "image too large (max 10 MB)"})
				return
			}
			filename, err := saveImage(fh)
			if errors.Is(err, errBadType) {
				removeSaved()
				c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "only JPEG, PNG and WebP are allowed"})
				return
			}
			if err != nil {
				removeSaved()
				log.Println("save image:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
				return
			}
			filenames = append(filenames, filename)
			urls = append(urls, "/uploads/"+filename)
		}

		bus := domain.BusObject{
			Name:        name,
			Description: c.PostForm("description"),
			ImageURLs:   urls,
			User:        domain.UserObject{ID: 1},
		}

		if err := busRepo.Create(&bus); err != nil {
			removeSaved()
			log.Println("create bus:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		hub.Broadcast("post_added", bus)
		c.JSON(http.StatusCreated, bus)
	})

	router.POST("/register", func(c *gin.Context) {
		var req registerRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid username, email or password"})
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Println("hash password:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		user := domain.UserObject{
			Username:     strings.TrimSpace(req.Username),
			Email:        strings.ToLower(strings.TrimSpace(req.Email)),
			PasswordHash: string(hash),
		}
		err = userRepo.Create(&user)
		if errors.Is(err, repository.ErrDuplicate) {
			c.JSON(http.StatusConflict, gin.H{"error": "username or email already taken"})
			return
		}
		if err != nil {
			log.Println("create user:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		c.JSON(http.StatusCreated, user) // PasswordHash is hidden by json:"-"
	})

	router.POST("/login", func(c *gin.Context) {
		var req loginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email and password are required"})
			return
		}

		user, err := userRepo.GetByEmail(strings.ToLower(strings.TrimSpace(req.Email)))
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "wrong email or password"})
			return
		}
		if err != nil {
			log.Println("get user:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "wrong email or password"})
			return
		}

		token, err := auth.CreateToken(jwtSecret, user.ID)
		if err != nil {
			log.Println("sign token:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"access_token": token, "user": user})
	})

	log.Fatal(router.Run(":8080"))
}

const (
	maxFileSize = 10 << 20 // 10 MB per image
	maxFiles    = 10
)

var allowedTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

var errBadType = errors.New("unsupported file type")

// / returns the generated filename.
func saveImage(fh *multipart.FileHeader) (string, error) {
	src, err := fh.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	// Sniff the real type from the first bytes
	buf := make([]byte, 512)
	n, err := src.Read(buf)
	if err != nil && err != io.EOF {
		return "", err
	}
	ext, ok := allowedTypes[http.DetectContentType(buf[:n])]
	if !ok {
		return "", errBadType
	}
	if _, err := src.Seek(0, io.SeekStart); err != nil { // rewind after sniffing
		return "", err
	}

	filename := uuid.NewString() + ext
	path := filepath.Join("uploads", filename)

	dst, err := os.Create(path)
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(dst, src); err != nil {
		dst.Close()
		os.Remove(path)
		return "", err
	}
	if err := dst.Close(); err != nil {
		os.Remove(path)
		return "", err
	}
	return filename, nil
}
