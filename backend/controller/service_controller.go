package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sami/models"
)

type ServiceController struct {
	DB *gorm.DB
}

// GetProjectServices lists all services for a specific project
func (sc *ServiceController) GetProjectServices(c *gin.Context) {
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
	if err := sc.DB.First(&project, projectID).Error; err != nil {
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
		if err := sc.DB.Where("project_id = ? AND user_id = ? AND state = ?",
			projectID, user.ID, "active").First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	// Get services for the project
	var services []models.Service
	if err := sc.DB.Preload("Creator").Preload("Updater").
		Where("project_id = ?", projectID).Find(&services).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch services",
		})
		return
	}

	// Convert to response format
	var serviceResponses []models.ServiceResponse
	for _, service := range services {
		serviceResponses = append(serviceResponses, service.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"services": serviceResponses,
	})
}

// CreateProjectService creates a new service in a specific project
func (sc *ServiceController) CreateProjectService(c *gin.Context) {
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
	if err := sc.DB.First(&project, projectID).Error; err != nil {
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
		if err := sc.DB.Where("project_id = ? AND user_id = ? AND state = ? AND role IN (?)",
			projectID, user.ID, "active", []string{"owner", "editor"}).First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	var req models.CreateServiceRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Set default values if not provided
	if req.Status == "" {
		req.Status = "active"
	}
	if req.Environment == "" {
		req.Environment = "production"
	}

	// Create new service
	service := models.Service{
		ProjectID:     uint(projectID),
		Name:          req.Name,
		Description:   req.Description,
		Type:          req.Type,
		Status:        req.Status,
		Version:       req.Version,
		Language:      req.Language,
		Environment:   req.Environment,
		DeployURL:     req.DeployURL,
		Domain:        req.Domain,
		GitRepo:       req.GitRepo,
		HealthMetrics: req.HealthMetrics,
		Metadata:      req.Metadata,
		PosX:          req.PosX,
		PosY:          req.PosY,
		Notes:         req.Notes,
		CreatedBy:     user.ID,
	}

	// Save to database
	if err := sc.DB.Create(&service).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create service",
		})
		return
	}

	// Load relationships
	sc.DB.Preload("Creator").Preload("Updater").First(&service, service.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Service created successfully",
		"service": service.ToResponse(),
	})
}

// GetService retrieves a specific service by ID
func (sc *ServiceController) GetService(c *gin.Context) {
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

	// Get service ID from URL
	serviceID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid service ID",
		})
		return
	}

	var service models.Service

	// Find service with all relationships
	if err := sc.DB.Preload("Creator").Preload("Updater").Preload("Project").
		First(&service, serviceID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Service not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch service",
			})
		}
		return
	}

	// Check if user has access to this service's project
	hasAccess := service.Project.OwnerID == user.ID || service.Project.Visibility == "public"
	if !hasAccess {
		// Check if user is a collaborator
		var collaborator models.ProjectCollaborator
		if err := sc.DB.Where("project_id = ? AND user_id = ? AND state = ?",
			service.ProjectID, user.ID, "active").First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"service": service.ToResponse(),
	})
}

// UpdateService updates a service
func (sc *ServiceController) UpdateService(c *gin.Context) {
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

	// Get service ID from URL
	serviceID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid service ID",
		})
		return
	}

	// Find existing service
	var service models.Service
	if err := sc.DB.Preload("Project").First(&service, serviceID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Service not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch service",
			})
		}
		return
	}

	// Check if user has access to modify this service's project
	hasAccess := service.Project.OwnerID == user.ID
	if !hasAccess {
		// Check if user is a collaborator with editor role
		var collaborator models.ProjectCollaborator
		if err := sc.DB.Where("project_id = ? AND user_id = ? AND state = ? AND role IN (?)",
			service.ProjectID, user.ID, "active", []string{"owner", "editor"}).First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	var req models.UpdateServiceRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Update only provided fields
	updates := make(map[string]interface{})

	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.Version != "" {
		updates["version"] = req.Version
	}
	if req.Language != "" {
		updates["language"] = req.Language
	}
	if req.Environment != "" {
		updates["environment"] = req.Environment
	}
	if req.DeployURL != "" {
		updates["deploy_url"] = req.DeployURL
	}
	if req.Domain != "" {
		updates["domain"] = req.Domain
	}
	if req.GitRepo != "" {
		updates["git_repo"] = req.GitRepo
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}
	if req.HealthMetrics != nil {
		updates["health_metrics"] = req.HealthMetrics
	}
	if req.Metadata != nil {
		updates["metadata"] = req.Metadata
	}

	// Always update position if provided (including 0 values)
	updates["pos_x"] = req.PosX
	updates["pos_y"] = req.PosY
	updates["updated_by"] = user.ID

	// Update service
	if err := sc.DB.Model(&service).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update service",
		})
		return
	}

	// Reload service with relationships
	sc.DB.Preload("Creator").Preload("Updater").First(&service, service.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Service updated successfully",
		"service": service.ToResponse(),
	})
}

// DeleteService deletes a service
func (sc *ServiceController) DeleteService(c *gin.Context) {
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

	// Get service ID from URL
	serviceID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid service ID",
		})
		return
	}

	// Find existing service
	var service models.Service
	if err := sc.DB.Preload("Project").First(&service, serviceID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Service not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch service",
			})
		}
		return
	}

	// Check if user has access to delete this service's project
	hasAccess := service.Project.OwnerID == user.ID
	if !hasAccess {
		// Check if user is a collaborator with owner/editor role
		var collaborator models.ProjectCollaborator
		if err := sc.DB.Where("project_id = ? AND user_id = ? AND state = ? AND role IN (?)",
			service.ProjectID, user.ID, "active", []string{"owner", "editor"}).First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	// Delete service
	if err := sc.DB.Delete(&service).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete service",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Service deleted successfully",
	})
}
