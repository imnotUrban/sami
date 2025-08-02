package routes

import (
	"sami/controller"

	"github.com/gin-gonic/gin"
)

// SetupCommentRoutes configures comment routes
func SetupCommentRoutes(r *gin.Engine, commentController *controller.CommentController, authController *controller.AuthController) {
	// Project comments routes - all protected by authentication middleware
	projects := r.Group("/projects")
	projects.Use(authController.AuthMiddleware())
	{
		projects.GET("/:id/comments", commentController.GetProjectComments)    // GET /projects/:id/comments
		projects.POST("/:id/comments", commentController.CreateProjectComment) // POST /projects/:id/comments
	}

	// Individual comment routes - all protected by authentication middleware
	comments := r.Group("/comments")
	comments.Use(authController.AuthMiddleware())
	{
		comments.GET("", commentController.GetAllUserComments)   // GET /comments (all user accessible comments)
		comments.GET("/:id", commentController.GetComment)       // GET /comments/:id
		comments.PUT("/:id", commentController.UpdateComment)    // PUT /comments/:id
		comments.DELETE("/:id", commentController.DeleteComment) // DELETE /comments/:id
	}
}
