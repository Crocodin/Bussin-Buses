package main

import (
	"log"
	"os"

	"bussin-buses/db"
	"bussin-buses/handler"
	"bussin-buses/repository"
	"bussin-buses/router"
	"bussin-buses/service"
	"bussin-buses/storage"
	"bussin-buses/ws"
)

const uploadDir = "uploads"

func main() {
	jwtSecret := loadJWTSecret()

	database, err := db.Open("bussin.db")
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	// repositories
	userRepo := repository.NewSQLiteUserRepository(database)
	busRepo := repository.NewSQLiteBusRepository(database)

	// infrastructure
	hub := ws.NewHub(jwtSecret)
	imageStore, err := storage.NewImageStore(uploadDir)
	if err != nil {
		log.Fatal(err)
	}

	// services
	authService := service.NewAuthService(userRepo, jwtSecret)
	busService := service.NewBusService(busRepo, userRepo, imageStore, hub)

	r := router.New(router.Deps{
		Auth:      handler.NewAuthHandler(authService),
		Bus:       handler.NewBusHandler(busService),
		Hub:       hub,
		JWTSecret: jwtSecret,
		UploadDir: uploadDir,
	})
	log.Fatal(r.Run(":8080"))
}

func loadJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Println("WARNING: JWT_SECRET not set, using an insecure dev secret")
		return []byte("dev-only-secret-change-me")
	}
	return []byte(secret)
}
