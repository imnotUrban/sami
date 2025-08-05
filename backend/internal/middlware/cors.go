package middlware

import (
	"sami/pkg/config"

	"github.com/gin-gonic/gin"
)

func Cors(cfg config.ServerConfig) func(c *gin.Context) {
	fn := func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", cfg.AllowedOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", cfg.AllowedMethods)

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
	return fn
}
