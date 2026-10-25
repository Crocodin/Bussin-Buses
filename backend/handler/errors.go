package handler

import (
	"errors"
	"log"
	"net/http"

	"bussin-buses/domain"

	"github.com/gin-gonic/gin"
)

func respondError(c *gin.Context, err error) {
	status := http.StatusInternalServerError
	switch {
	case errors.Is(err, domain.ErrNotFound):
		status = http.StatusNotFound
	case errors.Is(err, domain.ErrInvalidInput):
		status = http.StatusBadRequest
	case errors.Is(err, domain.ErrDuplicate):
		status = http.StatusConflict
	case errors.Is(err, domain.ErrInvalidCredentials), errors.Is(err, domain.ErrUnauthorized):
		status = http.StatusUnauthorized
	case errors.Is(err, domain.ErrFileTooLarge):
		status = http.StatusRequestEntityTooLarge
	case errors.Is(err, domain.ErrUnsupportedImage):
		status = http.StatusUnsupportedMediaType
	}

	if status == http.StatusInternalServerError {
		log.Println("internal error:", err) // log the details, never send them to the client
		c.JSON(status, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(status, gin.H{"error": err.Error()})
}
