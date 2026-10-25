package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func RequireAuth(secret []byte) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, found := strings.CutPrefix(c.GetHeader("Authorization"), "Bearer ")
		if !found {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}
		userID, err := VerifyToken(secret, tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set("userID", userID)
		c.Next()
	}
}
