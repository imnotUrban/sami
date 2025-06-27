package routes

import (
	"sami/controller"

	"github.com/gin-gonic/gin"
)

// SetupServiceRoutes configures service routes
func SetupServiceRoutes(r *gin.Engine, serviceController *controller.ServiceController, authController *controller.AuthController) {
	// Project services routes - nested under projects
	projects := r.Group("/projects")
	projects.Use(authController.AuthMiddleware())
	{
		// Service operations within projects
		projects.GET("/:id/services", serviceController.GetProjectServices)    // GET /projects/:id/services
		projects.POST("/:id/services", serviceController.CreateProjectService) // POST /projects/:id/services
	}

	// Individual service routes
	services := r.Group("/services")
	services.Use(authController.AuthMiddleware())
	{
		// Service CRUD operations
		services.GET("/:id", serviceController.GetService)       // GET /services/:id
		services.PUT("/:id", serviceController.UpdateService)    // PUT /services/:id
		services.DELETE("/:id", serviceController.DeleteService) // DELETE /services/:id
	}
}
