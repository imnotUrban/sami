package models

import (
	"time"

	"gorm.io/gorm"
)

// Comment represents the comment structure in the database
type Comment struct {
	ID        uint       `json:"id" gorm:"primaryKey"`
	ProjectID uint       `json:"project_id" gorm:"not null"`
	Project   Project    `json:"-" gorm:"foreignKey:ProjectID"`
	ServiceID *uint      `json:"service_id,omitempty" gorm:"nullable"`
	Service   *Service   `json:"-" gorm:"foreignKey:ServiceID"`
	UserID    uint       `json:"user_id" gorm:"not null"`
	User      User       `json:"-" gorm:"foreignKey:UserID"`
	ParentID  *uint      `json:"parent_id,omitempty" gorm:"nullable"`
	Parent    *Comment   `json:"-" gorm:"foreignKey:ParentID"`
	Content   string     `json:"content" gorm:"type:text;not null"`
	Type      string     `json:"type" gorm:"default:general;size:20"`
	Status    string     `json:"status" gorm:"default:active;size:20"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;default:now()"`
	EditedAt  *time.Time `json:"edited_at,omitempty" gorm:"nullable"`

	// Replies relationship for nested comments
	Replies []Comment `json:"-" gorm:"foreignKey:ParentID"`
}

// CreateCommentRequest represents comment creation data
type CreateCommentRequest struct {
	ServiceID *uint  `json:"service_id,omitempty"`
	ParentID  *uint  `json:"parent_id,omitempty"`
	Content   string `json:"content" binding:"required,min=1,max=5000"`
	Type      string `json:"type" binding:"omitempty,oneof=general issue improvement"`
}

// UpdateCommentRequest represents comment update data
type UpdateCommentRequest struct {
	Content string `json:"content" binding:"required,min=1,max=5000"`
}

// CommentResponse represents comment response
type CommentResponse struct {
	ID        uint              `json:"id"`
	ProjectID uint              `json:"project_id"`
	ServiceID *uint             `json:"service_id,omitempty"`
	Service   *ServiceResponse  `json:"service,omitempty"`
	UserID    uint              `json:"user_id"`
	User      UserResponse      `json:"user"`
	ParentID  *uint             `json:"parent_id,omitempty"`
	Content   string            `json:"content"`
	Type      string            `json:"type"`
	Status    string            `json:"status"`
	CreatedAt time.Time         `json:"created_at"`
	EditedAt  *time.Time        `json:"edited_at,omitempty"`
	Replies   []CommentResponse `json:"replies,omitempty"`
}

// ToResponse converts comment to CommentResponse
func (c *Comment) ToResponse() CommentResponse {
	response := CommentResponse{
		ID:        c.ID,
		ProjectID: c.ProjectID,
		ServiceID: c.ServiceID,
		UserID:    c.UserID,
		ParentID:  c.ParentID,
		Content:   c.Content,
		Type:      c.Type,
		Status:    c.Status,
		CreatedAt: c.CreatedAt,
		EditedAt:  c.EditedAt,
	}

	// Include user if loaded
	if c.User.ID != 0 {
		response.User = c.User.ToResponse()
	}

	// Include service if loaded
	if c.Service != nil && c.Service.ID != 0 {
		serviceResponse := c.Service.ToResponse()
		response.Service = &serviceResponse
	}

	// Convert replies if loaded
	for _, reply := range c.Replies {
		response.Replies = append(response.Replies, reply.ToResponse())
	}

	return response
}

// TableName specifies the table name for Comment
func (Comment) TableName() string {
	return "comments"
}

// BeforeCreate runs before creating a comment
func (c *Comment) BeforeCreate(tx *gorm.DB) error {
	if c.CreatedAt.IsZero() {
		c.CreatedAt = time.Now()
	}
	return nil
}

// BeforeUpdate runs before updating a comment
func (c *Comment) BeforeUpdate(tx *gorm.DB) error {
	now := time.Now()
	c.EditedAt = &now
	return nil
}
