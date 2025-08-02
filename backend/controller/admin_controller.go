package controller

import (
	"crypto/rand"
	"math/big"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sami/models"
)

type AdminController struct {
	DB *gorm.DB
}

// GetProjectHistory lists all change events for a specific project
func (ac *AdminController) GetProjectHistory(c *gin.Context) {
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
	if err := ac.DB.First(&project, projectID).Error; err != nil {
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
		if err := ac.DB.Where("project_id = ? AND user_id = ? AND state = ?",
			projectID, user.ID, models.StatusActive).First(&collaborator).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			return
		}
	}

	// Get query parameters for pagination and filtering
	limit := 50 // Default limit
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	offset := 0
	if o := c.Query("offset"); o != "" {
		if parsedOffset, err := strconv.Atoi(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	action := c.Query("action") // Filter by action type

	// Build query
	query := ac.DB.Preload("User").Preload("Service").Where("project_id = ?", projectID)

	if action != "" {
		query = query.Where("action = ?", action)
	}

	// Get total count
	var total int64
	query.Model(&models.ChangeHistory{}).Count(&total)

	// Get history entries with pagination
	var history []models.ChangeHistory
	if err := query.Order("timestamp DESC").Limit(limit).Offset(offset).Find(&history).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch project history",
		})
		return
	}

	// Convert to response format
	var historyResponses []models.HistoryResponse
	for _, h := range history {
		historyResponses = append(historyResponses, h.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"history": historyResponses,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetUsers lists all registered users (admin only)
func (ac *AdminController) GetUsers(c *gin.Context) {
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

	// Check if user is admin
	if user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Admin access required",
		})
		return
	}

	// Get query parameters for pagination and filtering
	limit := 50 // Default limit
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	offset := 0
	if o := c.Query("offset"); o != "" {
		if parsedOffset, err := strconv.Atoi(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	status := c.Query("status") // Filter by status
	role := c.Query("role")     // Filter by role
	search := c.Query("search") // Search by name or email

	// Build query
	query := ac.DB.Model(&models.User{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if role != "" {
		query = query.Where("role = ?", role)
	}

	if search != "" {
		query = query.Where("name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Exclude deleted users
	query = query.Where("deleted_at IS NULL")

	// Get total count
	var total int64
	query.Count(&total)

	// Get users with pagination
	var users []models.User
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch users",
		})
		return
	}

	// Convert to response format (without sensitive data)
	var userResponses []models.UserResponse
	for _, u := range users {
		userResponses = append(userResponses, u.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"users":  userResponses,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetUserStats provides statistics about users (admin only)
func (ac *AdminController) GetUserStats(c *gin.Context) {
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

	// Check if user is admin
	if user.Role != models.AdminRole {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Admin access required",
		})
		return
	}

	// Get various stats
	var totalUsers int64
	ac.DB.Model(&models.User{}).Where("deleted_at IS NULL").Count(&totalUsers)

	var activeUsers int64
	ac.DB.Model(&models.User{}).Where("status = ? AND deleted_at IS NULL", models.StatusActive).Count(&activeUsers)

	var adminUsers int64
	ac.DB.Model(&models.User{}).Where("role = ? AND deleted_at IS NULL", "admin").Count(&adminUsers)

	var totalProjects int64
	ac.DB.Model(&models.Project{}).Count(&totalProjects)

	var totalServices int64
	ac.DB.Model(&models.Service{}).Count(&totalServices)

	// Recent user registrations (last 30 days)
	var recentUsers int64
	ac.DB.Model(&models.User{}).
		Where("created_at >= NOW() - INTERVAL '30 days' AND deleted_at IS NULL").
		Count(&recentUsers)

	c.JSON(http.StatusOK, gin.H{
		"stats": gin.H{
			"total_users":    totalUsers,
			"active_users":   activeUsers,
			"admin_users":    adminUsers,
			"total_projects": totalProjects,
			"total_services": totalServices,
			"recent_users":   recentUsers,
		},
	})
}

// UpdateUser updates user information (admin only)
func (ac *AdminController) UpdateUser(c *gin.Context) {
	// Get authenticated user
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	authUser, ok := userInterface.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	// Check if user is admin
	if authUser.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Admin access required",
		})
		return
	}

	// Get user ID from URL
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	// Find the user to update
	var userToUpdate models.User
	if err := ac.DB.First(&userToUpdate, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch user",
			})
		}
		return
	}

	// Parse request body
	var updateData struct {
		Status *models.Status `json:"status"`
		Role   *models.Role   `json:"role"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	// Validate status if provided
	if updateData.Status != nil {
		valid := updateData.Status.IsValid()
		if !valid {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid status. Must be one of: active, inactive, suspended",
			})
			return
		}
		userToUpdate.Status = *updateData.Status
	}

	// Validate role if provided
	if updateData.Role != nil {
		valid := updateData.Role.IsValid()
		if !valid {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid role. Must be one of: user, admin",
			})
			return
		}
		userToUpdate.Role = *updateData.Role
	}

	// Save changes
	if err := ac.DB.Save(&userToUpdate).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": userToUpdate.ToResponse(),
	})
}

// DeleteUser soft deletes a user (admin only)
func (ac *AdminController) DeleteUser(c *gin.Context) {
	// Get authenticated user
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	authUser, ok := userInterface.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	// Check if user is admin
	if authUser.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Admin access required",
		})
		return
	}

	// Get user ID from URL
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	// Prevent self-deletion
	if userID == int(authUser.ID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot delete your own account",
		})
		return
	}

	// Find the user to delete
	var userToDelete models.User
	if err := ac.DB.First(&userToDelete, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch user",
			})
		}
		return
	}

	// Soft delete the user
	if err := ac.DB.Delete(&userToDelete).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
	})
}

// generateRandomPassword generates a random password with specified length
func generateRandomPassword(length int) (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

	password := make([]byte, length)
	for i := range password {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		password[i] = charset[num.Int64()]
	}

	return string(password), nil
}

// InviteUser creates a new user with a random password (admin only)
func (ac *AdminController) InviteUser(c *gin.Context) {
	// Get authenticated user
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	authUser, ok := userInterface.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	// Check if user is admin
	if authUser.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Admin access required",
		})
		return
	}

	// Parse request body
	var inviteData struct {
		Name  string      `json:"name" binding:"required"`
		Email string      `json:"email" binding:"required,email"`
		Role  models.Role `json:"role,omitempty"`
	}

	if err := c.ShouldBindJSON(&inviteData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Validate email format and normalize
	inviteData.Email = strings.ToLower(strings.TrimSpace(inviteData.Email))
	inviteData.Name = strings.TrimSpace(inviteData.Name)

	// Check if user already exists
	var existingUser models.User
	if err := ac.DB.Where("email = ?", inviteData.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "User already exists with this email",
		})
		return
	}

	// Set default role if not provided
	if inviteData.Role == "" {
		inviteData.Role = "user"
	}

	// Validate role
	if inviteData.Role != "user" && inviteData.Role != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role. Must be 'user' or 'admin'",
		})
		return
	}

	// Generate random password (12 characters)
	randomPassword, err := generateRandomPassword(12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate password",
		})
		return
	}

	// Create new user
	newUser := models.User{
		Name:   inviteData.Name,
		Email:  inviteData.Email,
		Role:   inviteData.Role,
		Status: models.StatusActive,
	}

	// Set hashed password
	if err := newUser.SetPassword(randomPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process password",
		})
		return
	}

	// Save to database
	if err := ac.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
		})
		return
	}

	// Return success response with generated password
	c.JSON(http.StatusCreated, gin.H{
		"message":  "User invited successfully",
		"user":     newUser.ToResponse(),
		"password": randomPassword, // Return password for admin to share
	})
}
