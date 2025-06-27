package routes

import (
	"sami/controller"

	"github.com/gin-gonic/gin"
)

// SetupProjectRoutes configures project routes
func SetupProjectRoutes(r *gin.Engine, projectController *controller.ProjectController, authController *controller.AuthController) {
	// Public routes (no authentication required)
	r.GET("/projects/public/:slug", projectController.GetPublicProjectBySlug) // GET /projects/public/:slug

	// Projects routes group - all protected by authentication middleware
	projects := r.Group("/projects")
	projects.Use(authController.AuthMiddleware())
	{
		// Project CRUD operations
		projects.GET("", projectController.GetProjects)          // GET /projects
		projects.POST("", projectController.CreateProject)       // POST /projects
		projects.GET("/:id", projectController.GetProject)       // GET /projects/:id
		projects.PUT("/:id", projectController.UpdateProject)    // PUT /projects/:id
		projects.DELETE("/:id", projectController.DeleteProject) // DELETE /projects/:id

		// Bulk operations
		projects.POST("/:id/bulk-save", projectController.BulkSaveProjectData)

		// Project collaborators operations
		projects.GET("/:id/collaborators", projectController.GetProjectCollaborators)             // GET /projects/:id/collaborators
		projects.POST("/:id/collaborators", projectController.AddProjectCollaborator)             // POST /projects/:id/collaborators
		projects.DELETE("/:id/collaborators/:email", projectController.RemoveProjectCollaborator) // DELETE /projects/:id/collaborators/:email
	}
}
