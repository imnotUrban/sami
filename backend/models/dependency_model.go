package models

import (
	"time"

	"gorm.io/gorm"
)

// Dependency represents the dependency structure in the database
type Dependency struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	SourceID    uint      `json:"source_id" gorm:"not null"`
	TargetID    uint      `json:"target_id" gorm:"not null"`
	Type        string    `json:"type" gorm:"size:50"`
	Description string    `json:"description" gorm:"type:text"`
	Protocol    string    `json:"protocol" gorm:"size:50"`
	Method      string    `json:"method" gorm:"size:20"`
	CreatedBy   uint      `json:"created_by" gorm:"not null"`
	UpdatedBy   *uint     `json:"updated_by"`
	CreatedAt   time.Time `json:"created_at" gorm:"not null;default:now()"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"not null;default:now()"`

	// Relations
	SourceService Service `json:"source_service" gorm:"foreignKey:SourceID"`
	TargetService Service `json:"target_service" gorm:"foreignKey:TargetID"`
	Creator       User    `json:"-" gorm:"foreignKey:CreatedBy"`
	Updater       User    `json:"-" gorm:"foreignKey:UpdatedBy"`
}

// CreateDependencyRequest represents dependency creation data
type CreateDependencyRequest struct {
	SourceID    uint   `json:"source_id" binding:"required"`
	TargetID    uint   `json:"target_id" binding:"required"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Protocol    string `json:"protocol"`
	Method      string `json:"method"`
}

// UpdateDependencyRequest represents dependency update data
type UpdateDependencyRequest struct {
	ID          uint   `json:"id" binding:"required"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Protocol    string `json:"protocol"`
	Method      string `json:"method"`
}

// DependencyResponse represents dependency response
type DependencyResponse struct {
	ID            uint            `json:"id"`
	SourceID      uint            `json:"source_id"`
	TargetID      uint            `json:"target_id"`
	Type          string          `json:"type"`
	Description   string          `json:"description"`
	Protocol      string          `json:"protocol"`
	Method        string          `json:"method"`
	CreatedBy     uint            `json:"created_by"`
	UpdatedBy     *uint           `json:"updated_by"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
	SourceService ServiceResponse `json:"source_service,omitempty"`
	TargetService ServiceResponse `json:"target_service,omitempty"`
	Creator       UserResponse    `json:"creator,omitempty"`
	Updater       UserResponse    `json:"updater,omitempty"`
}

// ToResponse converts dependency to DependencyResponse
func (d *Dependency) ToResponse() DependencyResponse {
	response := DependencyResponse{
		ID:          d.ID,
		SourceID:    d.SourceID,
		TargetID:    d.TargetID,
		Type:        d.Type,
		Description: d.Description,
		Protocol:    d.Protocol,
		Method:      d.Method,
		CreatedBy:   d.CreatedBy,
		UpdatedBy:   d.UpdatedBy,
		CreatedAt:   d.CreatedAt,
		UpdatedAt:   d.UpdatedAt,
	}

	// Include source service if loaded
	if d.SourceService.ID != 0 {
		response.SourceService = d.SourceService.ToResponse()
	}

	// Include target service if loaded
	if d.TargetService.ID != 0 {
		response.TargetService = d.TargetService.ToResponse()
	}

	// Include creator if loaded
	if d.Creator.ID != 0 {
		response.Creator = d.Creator.ToResponse()
	}

	// Include updater if loaded
	if d.Updater.ID != 0 {
		response.Updater = d.Updater.ToResponse()
	}

	return response
}

// TableName specifies the table name for Dependency
func (Dependency) TableName() string {
	return "dependencies"
}

// BeforeCreate runs before creating a dependency
func (d *Dependency) BeforeCreate(tx *gorm.DB) error {
	if d.CreatedAt.IsZero() {
		d.CreatedAt = time.Now()
	}
	if d.UpdatedAt.IsZero() {
		d.UpdatedAt = time.Now()
	}
	return nil
}

// BeforeUpdate runs before updating a dependency
func (d *Dependency) BeforeUpdate(tx *gorm.DB) error {
	d.UpdatedAt = time.Now()
	return nil
}
