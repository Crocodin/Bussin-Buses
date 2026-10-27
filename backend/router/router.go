package router

import (
	"bussin-buses/handler"
	auth "bussin-buses/jwt"
	"bussin-buses/ws"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Deps struct {
	Auth      *handler.AuthHandler
	Bus       *handler.BusHandler
	User      *handler.UserHandler
	Hub       *ws.Hub
	JWTSecret []byte
	UploadDir string
}

func New(d Deps) *gin.Engine {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:8100"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}))

	// public
	r.Static("/uploads", d.UploadDir)
	r.POST("/register", d.Auth.Register)
	r.POST("/login", d.Auth.Login)
	r.GET("/ws", d.Hub.Handle)

	// protected: a valid JWT is required
	api := r.Group("", auth.RequireAuth(d.JWTSecret))
	api.GET("/buses", d.Bus.List)
	api.GET("/buses/:id", d.Bus.Get)
	api.POST("/buses", d.Bus.Create)
	api.PUT("/users/me/picture", d.User.UpdateProfilePicture)

	return r
}
