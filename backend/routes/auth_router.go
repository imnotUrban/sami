package routes

import (
	"sami/controller"

	"github.com/gin-gonic/gin"
)

// SetupAuthRoutes configures authentication routes
func SetupAuthRoutes(r *gin.Engine, authController *controller.AuthController) {
	// Authentication routes group
	auth := r.Group("/auth")
	{
		// Public routes (no authentication required)
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)

		// Protected routes (authentication required)
		protected := auth.Group("/")
		protected.Use(authController.AuthMiddleware())
		{
			protected.GET("/me", authController.Me)
			protected.GET("/profile", authController.Me) // Alias for /me
			protected.PUT("/profile", authController.UpdateProfile)
			protected.POST("/change-password", authController.ChangePassword)
			protected.POST("/logout", authController.Logout)
		}
	}

	// Server health check route (optional)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Server running correctly",
		})
	})
}
