package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sami/models"
)

type DependencyController struct {
	DB *gorm.DB
}

// GetProjectDependencies lists all dependencies for a specific project
func (dc *DependencyController) GetProjectDependencies(c *gin.Context) {
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
	if err := dc.DB.First(&project, projectID).Error; err != nil {
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
		if err := dc.DB.Where("project_id = ? AND user_id = ? AND state = ?",
			projectID, user.ID, "active").First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	// Get dependencies for services in this project
	var dependencies []models.Dependency
	if err := dc.DB.
		Preload("SourceService").
		Preload("TargetService").
		Preload("Creator").
		Preload("Updater").
		Joins("JOIN services s1 ON dependencies.source_id = s1.id").
		Joins("JOIN services s2 ON dependencies.target_id = s2.id").
		Where("s1.project_id = ? AND s2.project_id = ?", projectID, projectID).
		Find(&dependencies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch dependencies",
		})
		return
	}

	// Convert to response format
	var dependencyResponses []models.DependencyResponse
	for _, dependency := range dependencies {
		dependencyResponses = append(dependencyResponses, dependency.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"dependencies": dependencyResponses,
	})
}

// CreateProjectDependency creates a new dependency between services in a project
func (dc *DependencyController) CreateProjectDependency(c *gin.Context) {
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
	if err := dc.DB.First(&project, projectID).Error; err != nil {
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

	// Check if user has access to modify this project
	hasAccess := project.OwnerID == user.ID
	if !hasAccess {
		// Check if user is a collaborator with editor role
		var collaborator models.ProjectCollaborator
		if err := dc.DB.Where("project_id = ? AND user_id = ? AND state = ? AND role IN (?)",
			projectID, user.ID, "active", []string{"owner", "editor"}).First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	var req models.CreateDependencyRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Validate that both services exist and belong to the project
	var sourceService models.Service
	if err := dc.DB.Where("id = ? AND project_id = ?", req.SourceID, projectID).First(&sourceService).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Source service not found in this project",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to validate source service",
			})
		}
		return
	}

	var targetService models.Service
	if err := dc.DB.Where("id = ? AND project_id = ?", req.TargetID, projectID).First(&targetService).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Target service not found in this project",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to validate target service",
			})
		}
		return
	}

	// Check if dependency already exists
	var existingDependency models.Dependency
	if err := dc.DB.Where("source_id = ? AND target_id = ?", req.SourceID, req.TargetID).First(&existingDependency).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Dependency already exists between these services",
		})
		return
	}

	// Create new dependency
	dependency := models.Dependency{
		SourceID:    req.SourceID,
		TargetID:    req.TargetID,
		Type:        req.Type,
		Description: req.Description,
		Protocol:    req.Protocol,
		Method:      req.Method,
		CreatedBy:   user.ID,
	}

	// Save to database
	if err := dc.DB.Create(&dependency).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create dependency",
		})
		return
	}

	// Load relationships
	if err := dc.DB.Preload("SourceService").Preload("TargetService").
		Preload("Creator").First(&dependency, dependency.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to load dependency details",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Dependency created successfully",
		"dependency": dependency.ToResponse(),
	})
}

// UpdateDependency updates an existing dependency
func (dc *DependencyController) UpdateDependency(c *gin.Context) {
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

	// Get dependency ID from URL
	dependencyID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid dependency ID",
		})
		return
	}

	// Find the dependency
	var dependency models.Dependency
	if err := dc.DB.Preload("SourceService").Preload("TargetService").
		First(&dependency, dependencyID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Dependency not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch dependency",
			})
		}
		return
	}

	// Check if user has access to modify this dependency
	// User must have access to the project containing both services
	sourceProjectID := dependency.SourceService.ProjectID

	// For now, we'll check the source service's project
	var project models.Project
	if err := dc.DB.First(&project, sourceProjectID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch project",
		})
		return
	}

	hasAccess := project.OwnerID == user.ID
	if !hasAccess {
		// Check if user is a collaborator with editor role
		var collaborator models.ProjectCollaborator
		if err := dc.DB.Where("project_id = ? AND user_id = ? AND state = ? AND role IN (?)",
			sourceProjectID, user.ID, "active", []string{"owner", "editor"}).First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	var req models.UpdateDependencyRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Update dependency fields
	dependency.Type = req.Type
	dependency.Description = req.Description
	dependency.Protocol = req.Protocol
	dependency.Method = req.Method
	dependency.UpdatedBy = &user.ID

	// Save to database
	if err := dc.DB.Save(&dependency).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update dependency",
		})
		return
	}

	// Load relationships
	if err := dc.DB.Preload("SourceService").Preload("TargetService").
		Preload("Creator").Preload("Updater").First(&dependency, dependency.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to load dependency details",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Dependency updated successfully",
		"dependency": dependency.ToResponse(),
	})
}

// DeleteDependency deletes a dependency
func (dc *DependencyController) DeleteDependency(c *gin.Context) {
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

	// Get dependency ID from URL
	dependencyID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid dependency ID",
		})
		return
	}

	// Find the dependency
	var dependency models.Dependency
	if err := dc.DB.Preload("SourceService").Preload("TargetService").
		First(&dependency, dependencyID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Dependency not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch dependency",
			})
		}
		return
	}

	// Check if user has access to modify this dependency
	sourceProjectID := dependency.SourceService.ProjectID
	var project models.Project
	if err := dc.DB.First(&project, sourceProjectID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch project",
		})
		return
	}

	hasAccess := project.OwnerID == user.ID
	if !hasAccess {
		// Check if user is a collaborator with editor role
		var collaborator models.ProjectCollaborator
		if err := dc.DB.Where("project_id = ? AND user_id = ? AND state = ? AND role IN (?)",
			sourceProjectID, user.ID, "active", []string{"owner", "editor"}).First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	// Delete the dependency
	if err := dc.DB.Delete(&dependency).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete dependency",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Dependency deleted successfully",
	})
}
