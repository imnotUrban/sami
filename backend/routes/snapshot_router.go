package routes

import (
	"sami/controller"

	"github.com/gin-gonic/gin"
)

// SetupSnapshotRoutes configures snapshot routes
func SetupSnapshotRoutes(r *gin.Engine, snapshotController *controller.SnapshotController, authController *controller.AuthController) {
	// Project snapshots routes group - all protected by authentication middleware
	projects := r.Group("/projects")
	projects.Use(authController.AuthMiddleware())
	{
		// Project snapshot operations
		projects.GET("/:id/snapshots", snapshotController.GetProjectSnapshots)    // GET /projects/:id/snapshots
		projects.POST("/:id/snapshots", snapshotController.CreateProjectSnapshot) // POST /projects/:id/snapshots
	}

	// Individual snapshot routes group - all protected by authentication middleware
	snapshots := r.Group("/snapshots")
	snapshots.Use(authController.AuthMiddleware())
	{
		// Individual snapshot operations
		snapshots.GET("/:id", snapshotController.GetSnapshot)              // GET /snapshots/:id
		snapshots.POST("/:id/restore", snapshotController.RestoreSnapshot) // POST /snapshots/:id/restore
	}
}
