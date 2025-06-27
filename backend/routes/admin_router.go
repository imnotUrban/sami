package routes

import (
	"sami/controller"

	"github.com/gin-gonic/gin"
)

// SetupAdminRoutes configures admin routes
func SetupAdminRoutes(r *gin.Engine, adminController *controller.AdminController, authController *controller.AuthController) {
	// Project history routes - all protected by authentication middleware
	projects := r.Group("/projects")
	projects.Use(authController.AuthMiddleware())
	{
		// Project history operations
		projects.GET("/:id/history", adminController.GetProjectHistory) // GET /projects/:id/history
	}

	// Admin routes group - all protected by authentication middleware
	admin := r.Group("/admin")
	admin.Use(authController.AuthMiddleware())
	{
		// Admin user management operations
		admin.GET("/users", adminController.GetUsers)           // GET /admin/users
		admin.GET("/users/stats", adminController.GetUserStats) // GET /admin/users/stats
		admin.PUT("/users/:id", adminController.UpdateUser)     // PUT /admin/users/:id
		admin.DELETE("/users/:id", adminController.DeleteUser)  // DELETE /admin/users/:id
	}
}
