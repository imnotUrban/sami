package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sami/models"
)

type CommentController struct {
	DB *gorm.DB
}

// GetProjectComments lists all comments for a specific project
func (cc *CommentController) GetProjectComments(c *gin.Context) {
	// Get authenticated user
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	user, ok := userInterface.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	// Get project ID from URL
	projectID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	// Check if project exists and user has access
	var project models.Project
	if err := cc.DB.First(&project, projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Project not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch project",
			})
		}
		return
	}

	// Check if user has access to this project
	hasAccess := project.OwnerID == user.ID || project.Visibility == "public"
	if !hasAccess {
		// Check if user is a collaborator
		var collaborator models.ProjectCollaborator
		if err := cc.DB.Where("project_id = ? AND user_id = ? AND state = ?",
			projectID, user.ID, "active").First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	var comments []models.Comment

	// Get query parameters for filtering
	serviceID := c.Query("service_id")
	commentType := c.Query("type")

	// Build query
	query := cc.DB.Where("project_id = ? AND status = ? AND parent_id IS NULL", projectID, "active")

	if serviceID != "" {
		query = query.Where("service_id = ?", serviceID)
	}

	if commentType != "" {
		query = query.Where("type = ?", commentType)
	}

	// Find comments with relationships and replies
	if err := query.Preload("User").Preload("Service").
		Preload("Replies", "status = ?", "active").
		Preload("Replies.User").Order("created_at DESC").Find(&comments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch comments",
		})
		return
	}

	// Convert to response format
	var commentResponses []models.CommentResponse
	for _, comment := range comments {
		commentResponses = append(commentResponses, comment.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"comments": commentResponses,
	})
}

// CreateProjectComment creates a new comment for a project
func (cc *CommentController) CreateProjectComment(c *gin.Context) {
	// Get authenticated user
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	user, ok := userInterface.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	// Get project ID from URL
	projectID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	var req models.CreateCommentRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Check if project exists and user has access
	var project models.Project
	if err := cc.DB.First(&project, projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Project not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch project",
			})
		}
		return
	}

	// Check if user has access to this project
	hasAccess := project.OwnerID == user.ID || project.Visibility == "public"
	if !hasAccess {
		// Check if user is a collaborator
		var collaborator models.ProjectCollaborator
		if err := cc.DB.Where("project_id = ? AND user_id = ? AND state = ?",
			projectID, user.ID, "active").First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	// Validate service exists if service_id is provided
	if req.ServiceID != nil {
		var service models.Service
		if err := cc.DB.Where("id = ? AND project_id = ?", *req.ServiceID, projectID).First(&service).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Service not found in this project",
			})
			return
		}
	}

	// Validate parent comment exists if parent_id is provided
	if req.ParentID != nil {
		var parentComment models.Comment
		if err := cc.DB.Where("id = ? AND project_id = ? AND status = ?", *req.ParentID, projectID, "active").First(&parentComment).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Parent comment not found",
			})
			return
		}
	}

	// Set default type if not provided
	if req.Type == "" {
		req.Type = "general"
	}

	// Create new comment
	comment := models.Comment{
		ProjectID: uint(projectID),
		ServiceID: req.ServiceID,
		UserID:    user.ID,
		ParentID:  req.ParentID,
		Content:   req.Content,
		Type:      req.Type,
		Status:    "active",
	}

	// Save to database
	if err := cc.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create comment",
		})
		return
	}

	// Load relationships for response
	cc.DB.Preload("User").Preload("Service").First(&comment, comment.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Comment created successfully",
		"comment": comment.ToResponse(),
	})
}

// GetComment retrieves a specific comment by ID
func (cc *CommentController) GetComment(c *gin.Context) {
	// Get authenticated user
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	user, ok := userInterface.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	// Get comment ID from URL
	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid comment ID",
		})
		return
	}

	var comment models.Comment

	// Find comment with all relationships
	if err := cc.DB.Preload("User").Preload("Service").Preload("Project").
		Preload("Replies", "status = ?", "active").
		Preload("Replies.User").Where("status = ?", "active").
		First(&comment, commentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Comment not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch comment",
			})
		}
		return
	}

	// Check if user has access to the project containing this comment
	hasAccess := comment.Project.OwnerID == user.ID || comment.Project.Visibility == "public"
	if !hasAccess {
		// Check if user is a collaborator
		var collaborator models.ProjectCollaborator
		if err := cc.DB.Where("project_id = ? AND user_id = ? AND state = ?",
			comment.ProjectID, user.ID, "active").First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"comment": comment.ToResponse(),
	})
}

// UpdateComment updates a comment's content
func (cc *CommentController) UpdateComment(c *gin.Context) {
	// Get authenticated user
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	user, ok := userInterface.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	// Get comment ID from URL
	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid comment ID",
		})
		return
	}

	var req models.UpdateCommentRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	var comment models.Comment

	// Find comment
	if err := cc.DB.Preload("Project").Where("status = ?", "active").
		First(&comment, commentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Comment not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch comment",
			})
		}
		return
	}

	// Check if user is the comment author or project owner
	if comment.UserID != user.ID && comment.Project.OwnerID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "You can only edit your own comments or comments in your projects",
		})
		return
	}

	// Update comment content
	comment.Content = req.Content

	// Save to database
	if err := cc.DB.Save(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update comment",
		})
		return
	}

	// Load relationships for response
	cc.DB.Preload("User").Preload("Service").First(&comment, comment.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Comment updated successfully",
		"comment": comment.ToResponse(),
	})
}

// DeleteComment performs logical deletion of a comment
func (cc *CommentController) DeleteComment(c *gin.Context) {
	// Get authenticated user
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	user, ok := userInterface.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	// Get comment ID from URL
	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid comment ID",
		})
		return
	}

	var comment models.Comment

	// Find comment
	if err := cc.DB.Preload("Project").Where("status = ?", "active").
		First(&comment, commentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Comment not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch comment",
			})
		}
		return
	}

	// Check if user is the comment author or project owner
	if comment.UserID != user.ID && comment.Project.OwnerID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "You can only delete your own comments or comments in your projects",
		})
		return
	}

	// Perform logical deletion
	comment.Status = "deleted"

	// Save to database
	if err := cc.DB.Save(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete comment",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Comment deleted successfully",
	})
}
