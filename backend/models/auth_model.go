package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Role represents the permission level or access type assigned to an entity,
type Role string

const (
	UserRole  Role = "user"
	AdminRole Role = "admin"
)

var validRoles = map[Role]bool{
	UserRole:  true,
	AdminRole: true,
}

func (r Role) IsValid() bool {
	return validRoles[r]
}

// Status represents the current state of an entity, such as a user account.
type Status string

const (
	StatusActive    Status = "active"
	StatusInactive  Status = "inactive"
	StatusSuspended Status = "suspended"
)

var validStatuses = map[Status]bool{
	StatusActive:    true,
	StatusInactive:  true,
	StatusSuspended: true,
}

func (s Status) IsValid() bool {
	return validStatuses[s]
}

// User represents the user structure in the database
type User struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	Name         string     `json:"name" gorm:"size:100"`
	Email        string     `json:"email" gorm:"unique;not null;size:255"`
	PasswordHash string     `json:"-" gorm:"not null;column:password_hash"`
	Phone        *string    `json:"phone" gorm:"size:20"`
	Role         Role       `json:"role" gorm:"default:user;size:50"`
	Status       Status     `json:"status" gorm:"default:active;size:20"`
	CreatedAt    time.Time  `json:"created_at" gorm:"not null;default:now()"`
	UpdatedAt    time.Time  `json:"updated_at" gorm:"not null;default:now()"`
	LastLogin    *time.Time `json:"last_login"`
	DeletedAt    *time.Time `json:"deleted_at"`
}

// RegisterRequest represents registration data
type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// LoginRequest represents login data
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// UserResponse represents user response (without sensitive data)
type UserResponse struct {
	ID        uint       `json:"id"`
	Username  string     `json:"username"`
	Name      string     `json:"full_name"`
	Email     string     `json:"email"`
	Phone     *string    `json:"phone"`
	Role      Role       `json:"role"`
	Status    Status     `json:"status"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	LastLogin *time.Time `json:"last_login"`
}

// LoginResponse represents login response
type LoginResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

// UpdateProfileRequest represents profile update data
type UpdateProfileRequest struct {
	Name  string `json:"full_name" binding:"required,min=2,max=100"`
	Email string `json:"email" binding:"required,email"`
	Phone string `json:"phone"`
}

// ChangePasswordRequest represents password change data
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

// SetPassword sets the hashed password
func (u *User) SetPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hashedPassword)
	return nil
}

// CheckPassword verifies if the password is correct
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

// ToResponse converts user to UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Username:  u.Email, // Use email as username for now
		Name:      u.Name,
		Email:     u.Email,
		Phone:     u.Phone,
		Role:      u.Role,
		Status:    u.Status,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
		LastLogin: u.LastLogin,
	}
}

// TableName specifies the table name in the database
func (User) TableName() string {
	return "users"
}

// BeforeCreate runs before creating a user
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.CreatedAt.IsZero() {
		u.CreatedAt = time.Now()
	}
	return nil
}

