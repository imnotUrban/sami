package controller

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sami/models"
)

type ProjectController struct {
	DB *gorm.DB
}

// GetProjects lists all visible projects for the authenticated user
func (pc *ProjectController) GetProjects(c *gin.Context) {
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

	var projects []models.Project

	// Query projects: owned by user OR public projects OR user is a collaborator
	if err := pc.DB.Where("owner_id = ? OR visibility = ? OR id IN (SELECT project_id FROM project_collaborators WHERE user_id = ? AND state = ?)",
		user.ID, "public", user.ID, "active").Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch projects",
		})
		return
	}

	// Load owner relationships for response
	for i := range projects {
		pc.DB.Model(&projects[i]).Association("Owner").Find(&projects[i].Owner)
	}

	// Convert to response format
	var projectResponses []models.ProjectResponse
	for _, project := range projects {
		projectResponses = append(projectResponses, project.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"projects": projectResponses,
	})
}

// CreateProject creates a new project
func (pc *ProjectController) CreateProject(c *gin.Context) {
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

	var req models.CreateProjectRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Check if project slug already exists
	var existingProject models.Project
	if err := pc.DB.Where("slug = ?", req.Slug).First(&existingProject).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Project with this slug already exists",
		})
		return
	}

	// Set default visibility if not provided
	if req.Visibility == "" {
		req.Visibility = "private"
	}

	// Create new project
	project := models.Project{
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		OwnerID:     user.ID,
		Visibility:  req.Visibility,
		Status:      "active",
	}

	// Save to database
	if err := pc.DB.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create project",
		})
		return
	}

	// Load owner relationship
	pc.DB.Preload("Owner").First(&project, project.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Project created successfully",
		"project": project.ToResponse(),
	})
}

// GetProject retrieves a specific project by ID
func (pc *ProjectController) GetProject(c *gin.Context) {
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

	var project models.Project

	// Find project with all relationships
	if err := pc.DB.Preload("Owner").Preload("Collaborators.User").
		First(&project, projectID).Error; err != nil {
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
		if err := pc.DB.Where("project_id = ? AND user_id = ? AND state = ?",
			projectID, user.ID, "active").First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"project": project.ToResponse(),
	})
}

// UpdateProject updates a project
func (pc *ProjectController) UpdateProject(c *gin.Context) {
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

	var req models.UpdateProjectRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Find project
	var project models.Project
	if err := pc.DB.First(&project, projectID).Error; err != nil {
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

	// Check if user is owner or admin
	if project.OwnerID != user.ID && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Only project owner can update project",
		})
		return
	}

	// Update fields if provided
	if req.Name != "" {
		project.Name = req.Name
	}
	if req.Description != "" {
		project.Description = req.Description
	}
	if req.Visibility != "" {
		project.Visibility = req.Visibility
	}
	if req.Status != "" {
		project.Status = req.Status
	}

	// Save changes
	if err := pc.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update project",
		})
		return
	}

	// Load owner relationship
	pc.DB.Preload("Owner").First(&project, project.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Project updated successfully",
		"project": project.ToResponse(),
	})
}

// DeleteProject deletes (archives) a project
func (pc *ProjectController) DeleteProject(c *gin.Context) {
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

	// Find project
	var project models.Project
	if err := pc.DB.First(&project, projectID).Error; err != nil {
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

	// Check if user is owner or admin
	if project.OwnerID != user.ID && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Only project owner can delete project",
		})
		return
	}

	// Archive the project by updating status
	project.Status = "archived"
	if err := pc.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete project",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project deleted successfully",
	})
}

// GetProjectCollaborators lists all collaborators of a project
func (pc *ProjectController) GetProjectCollaborators(c *gin.Context) {
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
	if err := pc.DB.First(&project, projectID).Error; err != nil {
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
		if err := pc.DB.Where("project_id = ? AND user_id = ? AND state = ?",
			projectID, user.ID, "active").First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	// Get all collaborators
	var collaborators []models.ProjectCollaborator
	if err := pc.DB.Preload("User").Where("project_id = ? AND state = ?",
		projectID, "active").Find(&collaborators).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch collaborators",
		})
		return
	}

	// Convert to response format
	var collaboratorResponses []models.CollaboratorResponse
	for _, collab := range collaborators {
		collaboratorResponses = append(collaboratorResponses, collab.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"collaborators": collaboratorResponses,
	})
}

// AddProjectCollaborator adds a collaborator to a project
func (pc *ProjectController) AddProjectCollaborator(c *gin.Context) {
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

	var req models.AddCollaboratorRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Find project
	var project models.Project
	if err := pc.DB.First(&project, projectID).Error; err != nil {
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

	// Check if user is owner or admin
	if project.OwnerID != user.ID && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Only project owner can add collaborators",
		})
		return
	}

	// Check if target user exists by email
	var targetUser models.User
	if err := pc.DB.Where("email = ?", req.Email).First(&targetUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found with this email",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch user",
			})
		}
		return
	}

	// Check if user is already a collaborator
	var existingCollab models.ProjectCollaborator
	if err := pc.DB.Where("project_id = ? AND user_id = ?",
		projectID, targetUser.ID).First(&existingCollab).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "User is already a collaborator",
		})
		return
	}

	// Set default role if not provided
	if req.Role == "" {
		req.Role = "editor"
	}

	// Create collaborator
	collaborator := models.ProjectCollaborator{
		ProjectID: uint(projectID),
		UserID:    targetUser.ID,
		Role:      req.Role,
		State:     "active",
	}

	// Save to database
	if err := pc.DB.Create(&collaborator).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to add collaborator",
		})
		return
	}

	// Load user relationship
	pc.DB.Preload("User").First(&collaborator, "project_id = ? AND user_id = ?", projectID, targetUser.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Collaborator added successfully",
		"collaborator": collaborator.ToResponse(),
	})
}

// RemoveProjectCollaborator removes a collaborator from a project
func (pc *ProjectController) RemoveProjectCollaborator(c *gin.Context) {
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

	// Get email from URL
	emailToRemove := c.Param("email")
	if emailToRemove == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Email is required",
		})
		return
	}

	// Find project
	var project models.Project
	if err := pc.DB.First(&project, projectID).Error; err != nil {
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

	// Check if user is owner or admin
	if project.OwnerID != user.ID && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Only project owner can remove collaborators",
		})
		return
	}

	// Find user by email first
	var userToRemove models.User
	if err := pc.DB.Where("email = ?", emailToRemove).First(&userToRemove).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found with this email",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch user",
			})
		}
		return
	}

	// Find collaborator
	var collaborator models.ProjectCollaborator
	if err := pc.DB.Where("project_id = ? AND user_id = ?",
		projectID, userToRemove.ID).First(&collaborator).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Collaborator not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch collaborator",
			})
		}
		return
	}

	// Delete collaborator
	if err := pc.DB.Delete(&collaborator).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to remove collaborator",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Collaborator removed successfully",
	})
}

// GetPublicProjectBySlug retrieves a public project by its slug (no authentication required)
func (pc *ProjectController) GetPublicProjectBySlug(c *gin.Context) {
	// Get slug from URL
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Slug is required",
		})
		return
	}

	var project models.Project

	// Find project with owner relationship
	if err := pc.DB.Preload("Owner").Where("slug = ?", slug).First(&project).Error; err != nil {
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

	// Check if project is public
	if project.Visibility != "public" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "This project is private",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"project": project.ToResponse(),
	})
}

// BulkSaveProjectData handles bulk save operations for services and dependencies
func (pc *ProjectController) BulkSaveProjectData(c *gin.Context) {
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

	var req models.BulkSaveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Validate project access
	var project models.Project
	if err := pc.DB.Where("id = ? AND owner_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Project not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database error",
		})
		return
	}

	// Start transaction
	tx := pc.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to start transaction",
		})
		return
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Transaction failed",
			})
		}
	}()

	// Execute bulk operations
	result, err := models.ExecuteBulkSave(tx, uint(projectID), user.ID, req)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bulk save failed",
			"details": err.Error(),
		})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to commit transaction",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bulk save successful",
		"result":  result,
	})
}
