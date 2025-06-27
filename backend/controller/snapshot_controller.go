package controller

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sami/models"
)

type SnapshotController struct {
	DB *gorm.DB
}

// GetProjectSnapshots lists all snapshots for a specific project
func (sc *SnapshotController) GetProjectSnapshots(c *gin.Context) {
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

	// Verify project exists and user has access
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

	// Get all snapshots for this project, ordered by version_num descending
	var snapshots []models.DiagramSnapshot
	if err := sc.DB.Preload("User").Where("project_id = ?", projectID).
		Order("version_num DESC").Find(&snapshots).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch snapshots",
		})
		return
	}

	// Convert to response format
	var snapshotResponses []models.SnapshotResponse
	for _, snapshot := range snapshots {
		snapshotResponses = append(snapshotResponses, snapshot.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"snapshots": snapshotResponses,
		"total":     len(snapshotResponses),
	})
}

// CreateProjectSnapshot creates a new snapshot of the current project state
func (sc *SnapshotController) CreateProjectSnapshot(c *gin.Context) {
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

	// Verify project exists and user has access
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

	// Check if user has write access (owner or editor)
	hasWriteAccess := project.OwnerID == user.ID
	if !hasWriteAccess {
		var collaborator models.ProjectCollaborator
		if err := sc.DB.Where("project_id = ? AND user_id = ? AND state = ? AND role IN (?)",
			projectID, user.ID, "active", []string{"owner", "editor"}).First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Write access required",
			})
			return
		}
	}

	// Parse request
	var req models.CreateSnapshotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Get current project state (services and dependencies)
	var services []models.Service
	if err := sc.DB.Where("project_id = ?", projectID).Find(&services).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch services",
		})
		return
	}

	var dependencies []models.Dependency
	if err := sc.DB.Joins("JOIN services ON services.id = dependencies.source_id OR services.id = dependencies.target_id").
		Where("services.project_id = ?", projectID).Find(&dependencies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch dependencies",
		})
		return
	}

	// Create snapshot data
	snapshotData := gin.H{
		"services":     services,
		"dependencies": dependencies,
		"metadata": gin.H{
			"created_at": user.Name,
			"created_by": user.ID,
			"timestamp":  user.Name,
		},
	}

	// Convert to JSON
	snapshotJSON, err := json.Marshal(snapshotData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to serialize snapshot data",
		})
		return
	}

	// Get next version number
	var maxVersionNum int
	sc.DB.Model(&models.DiagramSnapshot{}).Where("project_id = ?", projectID).
		Select("COALESCE(MAX(version_num), 0)").Scan(&maxVersionNum)

	// Create new snapshot
	snapshot := models.DiagramSnapshot{
		ProjectID:  uint(projectID),
		VersionNum: maxVersionNum + 1,
		Snapshot:   snapshotJSON,
		CreatedBy:  user.ID,
		Notes:      req.Notes,
	}

	// Save to database
	if err := sc.DB.Create(&snapshot).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create snapshot",
		})
		return
	}

	// Load user relationship
	sc.DB.Preload("User").First(&snapshot, snapshot.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Snapshot created successfully",
		"snapshot": snapshot.ToResponse(),
	})
}

// GetSnapshot retrieves a specific snapshot by ID
func (sc *SnapshotController) GetSnapshot(c *gin.Context) {
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

	// Get snapshot ID from URL
	snapshotID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid snapshot ID",
		})
		return
	}

	// Find snapshot with project and user relationships
	var snapshot models.DiagramSnapshot
	if err := sc.DB.Preload("User").Preload("Project").
		First(&snapshot, snapshotID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Snapshot not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch snapshot",
			})
		}
		return
	}

	// Check if user has access to the project
	hasAccess := snapshot.Project.OwnerID == user.ID || snapshot.Project.Visibility == "public"
	if !hasAccess {
		// Check if user is a collaborator
		var collaborator models.ProjectCollaborator
		if err := sc.DB.Where("project_id = ? AND user_id = ? AND state = ?",
			snapshot.ProjectID, user.ID, "active").First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"snapshot": snapshot.ToResponse(),
	})
}

// RestoreSnapshot restores a project to a specific snapshot state
func (sc *SnapshotController) RestoreSnapshot(c *gin.Context) {
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

	// Get snapshot ID from URL
	snapshotID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid snapshot ID",
		})
		return
	}

	// Parse request
	var req models.RestoreSnapshotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// If no body provided, continue with default values
		req.Force = false
	}

	// Find snapshot with project relationship
	var snapshot models.DiagramSnapshot
	if err := sc.DB.Preload("Project").First(&snapshot, snapshotID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Snapshot not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch snapshot",
			})
		}
		return
	}

	// Check if user has write access (owner or editor)
	hasWriteAccess := snapshot.Project.OwnerID == user.ID
	if !hasWriteAccess {
		var collaborator models.ProjectCollaborator
		if err := sc.DB.Where("project_id = ? AND user_id = ? AND state = ? AND role IN (?)",
			snapshot.ProjectID, user.ID, "active", []string{"owner", "editor"}).First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Write access required",
			})
			return
		}
	}

	// Parse snapshot data
	var snapshotData map[string]interface{}
	if err := json.Unmarshal(snapshot.Snapshot, &snapshotData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to parse snapshot data",
		})
		return
	}

	// Start transaction for rollback safety
	tx := sc.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create a backup snapshot before restoration (if not forced)
	if !req.Force {
		// Get current state and create backup
		var currentServices []models.Service
		if err := tx.Where("project_id = ?", snapshot.ProjectID).Find(&currentServices).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to backup current state",
			})
			return
		}

		var currentDependencies []models.Dependency
		if err := tx.Joins("JOIN services ON services.id = dependencies.source_id OR services.id = dependencies.target_id").
			Where("services.project_id = ?", snapshot.ProjectID).Find(&currentDependencies).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to backup current state",
			})
			return
		}

		backupData := gin.H{
			"services":     currentServices,
			"dependencies": currentDependencies,
			"metadata": gin.H{
				"backup_before_restore": true,
				"restored_from":         snapshotID,
				"created_by":            user.ID,
			},
		}

		backupJSON, _ := json.Marshal(backupData)

		var maxVersionNum int
		tx.Model(&models.DiagramSnapshot{}).Where("project_id = ?", snapshot.ProjectID).
			Select("COALESCE(MAX(version_num), 0)").Scan(&maxVersionNum)

		backupSnapshot := models.DiagramSnapshot{
			ProjectID:  snapshot.ProjectID,
			VersionNum: maxVersionNum + 1,
			Snapshot:   backupJSON,
			CreatedBy:  user.ID,
			Notes:      "Automatic backup before restore",
		}

		if err := tx.Create(&backupSnapshot).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to create backup",
			})
			return
		}
	}

	// Clear current services and dependencies
	if err := tx.Where("project_id = ?", snapshot.ProjectID).Delete(&models.Service{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to clear current services",
		})
		return
	}

	// Note: Dependencies will be cascade deleted due to foreign key constraints

	// Restore services from snapshot
	if servicesData, ok := snapshotData["services"].([]interface{}); ok {
		for _, serviceData := range servicesData {
			serviceJSON, _ := json.Marshal(serviceData)
			var service models.Service
			if err := json.Unmarshal(serviceJSON, &service); err != nil {
				continue // Skip invalid services
			}
			// Reset ID and timestamps for new creation
			service.ID = 0
			service.CreatedBy = user.ID
			service.UpdatedBy = &user.ID
			if err := tx.Create(&service).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Failed to restore services",
				})
				return
			}
		}
	}

	// Restore dependencies from snapshot
	if dependenciesData, ok := snapshotData["dependencies"].([]interface{}); ok {
		for _, dependencyData := range dependenciesData {
			dependencyJSON, _ := json.Marshal(dependencyData)
			var dependency models.Dependency
			if err := json.Unmarshal(dependencyJSON, &dependency); err != nil {
				continue // Skip invalid dependencies
			}
			// Reset ID and timestamps for new creation
			dependency.ID = 0
			dependency.CreatedBy = user.ID
			dependency.UpdatedBy = &user.ID
			if err := tx.Create(&dependency).Error; err != nil {
				// Skip dependencies that might reference non-existent services
				continue
			}
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to commit restoration",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Snapshot restored successfully",
		"snapshot": gin.H{
			"id":         snapshot.ID,
			"version":    snapshot.VersionNum,
			"project_id": snapshot.ProjectID,
		},
	})
}
