package controller

import (
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"

	"sami/models"
)

type AuthController struct {
	DB *gorm.DB
}

var jwtSecret = []byte("your-secret-key") // In production, use environment variable

// Claims represents JWT claims
type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// Register handles new user registration
func (ac *AuthController) Register(c *gin.Context) {
	var req models.RegisterRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := ac.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "User already exists with this email",
		})
		return
	}

	// Create new user
	user := models.User{
		Name:   req.Name,
		Email:  req.Email,
		Role:   "user",
		Status: "active",
	}

	// Set hashed password
	if err := user.SetPassword(req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process password",
		})
		return
	}

	// Save to database
	if err := ac.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user":    user.ToResponse(),
	})
}

// Login handles user authentication
func (ac *AuthController) Login(c *gin.Context) {
	var req models.LoginRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Find user by email
	var user models.User
	if err := ac.DB.Where("email = ? AND status = ?", req.Email, "active").First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	// Verify password
	if !user.CheckPassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	// Generate JWT token
	token, err := ac.generateJWT(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate token",
		})
		return
	}

	// Update last login
	now := time.Now()
	user.LastLogin = &now
	ac.DB.Save(&user)

	// Successful response
	response := models.LoginResponse{
		Token: token,
		User:  user.ToResponse(),
	}

	c.JSON(http.StatusOK, response)
}

// Me returns authenticated user data
func (ac *AuthController) Me(c *gin.Context) {
	// Get user from context (set by middleware)
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

	c.JSON(http.StatusOK, gin.H{
		"user": user.ToResponse(),
	})
}

// Logout handles user logout
func (ac *AuthController) Logout(c *gin.Context) {
	// In this simple case, we just return a success message
	// In more complex implementations, you could invalidate the token
	// or maintain a blacklist of tokens
	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

// UpdateProfile updates authenticated user's profile information
func (ac *AuthController) UpdateProfile(c *gin.Context) {
	// Get user from context (set by middleware)
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

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Check if email is being changed and if it's already in use
	if req.Email != user.Email {
		var existingUser models.User
		if err := ac.DB.Where("email = ? AND id != ?", req.Email, user.ID).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Email already in use by another user",
			})
			return
		}
	}

	// Update user fields
	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Phone != "" {
		user.Phone = &req.Phone
	}

	// Save updated user
	if err := ac.DB.Save(user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update profile",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user":    user.ToResponse(),
	})
}

// ChangePassword changes the authenticated user's password
func (ac *AuthController) ChangePassword(c *gin.Context) {
	// Get user from context (set by middleware)
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

	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid data",
			"details": err.Error(),
		})
		return
	}

	// Verify current password
	if !user.CheckPassword(req.CurrentPassword) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Current password is incorrect",
		})
		return
	}

	// Validate new password length
	if len(req.NewPassword) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "New password must be at least 6 characters long",
		})
		return
	}

	// Set new password
	if err := user.SetPassword(req.NewPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process new password",
		})
		return
	}

	// Save updated user
	if err := ac.DB.Save(user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update password",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password changed successfully",
	})
}

// generateJWT generates a JWT token for the user
func (ac *AuthController) generateJWT(user *models.User) (string, error) {
	// Get secret from environment or use default value
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = string(jwtSecret)
	}

	claims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// AuthMiddleware verifies JWT token
func (ac *AuthController) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization token required",
			})
			c.Abort()
			return
		}

		// Extract token (format: "Bearer TOKEN")
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token format",
			})
			c.Abort()
			return
		}

		// Verify token
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = string(jwtSecret)
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token",
			})
			c.Abort()
			return
		}

		// Extract claims
		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid claims",
			})
			c.Abort()
			return
		}

		// Find user in database
		var user models.User
		if err := ac.DB.Where("id = ? AND status = ?", claims.UserID, "active").First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User not found or inactive",
			})
			c.Abort()
			return
		}

		// Set user in context
		c.Set("user", &user)
		c.Set("user_id", strconv.Itoa(int(user.ID)))
		c.Set("user_role", user.Role)

		c.Next()
	}
}
