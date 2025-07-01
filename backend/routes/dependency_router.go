package routes

import (
	"sami/controller"

	"github.com/gin-gonic/gin"
)

// SetupDependencyRoutes configures dependency routes
func SetupDependencyRoutes(r *gin.Engine, dependencyController *controller.DependencyController, authController *controller.AuthController) {
	// Project dependencies routes - nested under projects
	projects := r.Group("/projects")
	projects.Use(authController.AuthMiddleware())
	{
		// Dependency operations within projects
		projects.GET("/:id/dependencies", dependencyController.GetProjectDependencies)   // GET /projects/:id/dependencies
		projects.POST("/:id/dependencies", dependencyController.CreateProjectDependency) // POST /projects/:id/dependencies
	}

	// Individual dependency routes
	dependencies := r.Group("/dependencies")
	dependencies.Use(authController.AuthMiddleware())
	{
		// Dependency CRUD operations
		dependencies.PUT("/:id", dependencyController.UpdateDependency)    // PUT /dependencies/:id
		dependencies.DELETE("/:id", dependencyController.DeleteDependency) // DELETE /dependencies/:id
	}
}
