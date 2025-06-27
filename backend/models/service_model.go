package models

import (
	"time"

	"gorm.io/gorm"
)

// Service represents the service structure in the database
type Service struct {
	ID            uint        `json:"id" gorm:"primaryKey"`
	ProjectID     uint        `json:"project_id" gorm:"not null"`
	Project       Project     `json:"-" gorm:"foreignKey:ProjectID"`
	Name          string      `json:"name" gorm:"not null;size:100"`
	Description   string      `json:"description" gorm:"type:text"`
	Type          string      `json:"type" gorm:"not null;size:50"`
	Status        string      `json:"status" gorm:"default:active;size:20"`
	Version       string      `json:"version" gorm:"size:50"`
	Language      string      `json:"language" gorm:"size:50"`
	Environment   string      `json:"environment" gorm:"default:production;size:20"`
	DeployURL     string      `json:"deploy_url" gorm:"size:255"`
	Domain        string      `json:"domain" gorm:"size:255"`
	GitRepo       string      `json:"git_repo" gorm:"size:255"`
	HealthMetrics interface{} `json:"health_metrics" gorm:"type:jsonb"`
	Metadata      interface{} `json:"metadata" gorm:"type:jsonb"`
	PosX          int         `json:"pos_x" gorm:"default:0"`
	PosY          int         `json:"pos_y" gorm:"default:0"`
	Notes         string      `json:"notes" gorm:"type:text"`
	CreatedBy     uint        `json:"created_by" gorm:"not null"`
	UpdatedBy     *uint       `json:"updated_by"`
	CreatedAt     time.Time   `json:"created_at" gorm:"not null;default:now()"`
	UpdatedAt     time.Time   `json:"updated_at" gorm:"not null;default:now()"`

	// Relations
	Creator User `json:"-" gorm:"foreignKey:CreatedBy"`
	Updater User `json:"-" gorm:"foreignKey:UpdatedBy"`
}

// CreateServiceRequest represents service creation data
type CreateServiceRequest struct {
	Name          string      `json:"name" binding:"required,min=2,max=100"`
	Description   string      `json:"description"`
	Type          string      `json:"type" binding:"required,min=2,max=50"`
	Status        string      `json:"status" binding:"omitempty,oneof=active inactive"`
	Version       string      `json:"version"`
	Language      string      `json:"language"`
	Environment   string      `json:"environment" binding:"omitempty,oneof=production development"`
	DeployURL     string      `json:"deploy_url"`
	Domain        string      `json:"domain"`
	GitRepo       string      `json:"git_repo"`
	HealthMetrics interface{} `json:"health_metrics"`
	Metadata      interface{} `json:"metadata"`
	PosX          int         `json:"pos_x"`
	PosY          int         `json:"pos_y"`
	Notes         string      `json:"notes"`
}

// UpdateServiceRequest represents service update data
type UpdateServiceRequest struct {
	ID            uint        `json:"id" binding:"required"`
	Name          string      `json:"name" binding:"omitempty,min=2,max=100"`
	Description   string      `json:"description"`
	Type          string      `json:"type" binding:"omitempty,min=2,max=50"`
	Status        string      `json:"status" binding:"omitempty,oneof=active inactive"`
	Version       string      `json:"version"`
	Language      string      `json:"language"`
	Environment   string      `json:"environment" binding:"omitempty,oneof=production development"`
	DeployURL     string      `json:"deploy_url"`
	Domain        string      `json:"domain"`
	GitRepo       string      `json:"git_repo"`
	HealthMetrics interface{} `json:"health_metrics"`
	Metadata      interface{} `json:"metadata"`
	PosX          int         `json:"pos_x"`
	PosY          int         `json:"pos_y"`
	Notes         string      `json:"notes"`
}

// ServiceResponse represents service response
type ServiceResponse struct {
	ID            uint         `json:"id"`
	ProjectID     uint         `json:"project_id"`
	Name          string       `json:"name"`
	Description   string       `json:"description"`
	Type          string       `json:"type"`
	Status        string       `json:"status"`
	Version       string       `json:"version"`
	Language      string       `json:"language"`
	Environment   string       `json:"environment"`
	DeployURL     string       `json:"deploy_url"`
	Domain        string       `json:"domain"`
	GitRepo       string       `json:"git_repo"`
	HealthMetrics interface{}  `json:"health_metrics"`
	Metadata      interface{}  `json:"metadata"`
	PosX          int          `json:"pos_x"`
	PosY          int          `json:"pos_y"`
	Notes         string       `json:"notes"`
	CreatedBy     uint         `json:"created_by"`
	UpdatedBy     *uint        `json:"updated_by"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
	Creator       UserResponse `json:"creator,omitempty"`
	Updater       UserResponse `json:"updater,omitempty"`
}

// ToResponse converts service to ServiceResponse
func (s *Service) ToResponse() ServiceResponse {
	response := ServiceResponse{
		ID:            s.ID,
		ProjectID:     s.ProjectID,
		Name:          s.Name,
		Description:   s.Description,
		Type:          s.Type,
		Status:        s.Status,
		Version:       s.Version,
		Language:      s.Language,
		Environment:   s.Environment,
		DeployURL:     s.DeployURL,
		Domain:        s.Domain,
		GitRepo:       s.GitRepo,
		HealthMetrics: s.HealthMetrics,
		Metadata:      s.Metadata,
		PosX:          s.PosX,
		PosY:          s.PosY,
		Notes:         s.Notes,
		CreatedBy:     s.CreatedBy,
		UpdatedBy:     s.UpdatedBy,
		CreatedAt:     s.CreatedAt,
		UpdatedAt:     s.UpdatedAt,
	}

	// Include creator if loaded
	if s.Creator.ID != 0 {
		response.Creator = s.Creator.ToResponse()
	}

	// Include updater if loaded
	if s.Updater.ID != 0 {
		response.Updater = s.Updater.ToResponse()
	}

	return response
}

// TableName specifies the table name for Service
func (Service) TableName() string {
	return "services"
}

// BeforeCreate runs before creating a service
func (s *Service) BeforeCreate(tx *gorm.DB) error {
	if s.CreatedAt.IsZero() {
		s.CreatedAt = time.Now()
	}
	if s.UpdatedAt.IsZero() {
		s.UpdatedAt = time.Now()
	}
	return nil
}

// BeforeUpdate runs before updating a service
func (s *Service) BeforeUpdate(tx *gorm.DB) error {
	s.UpdatedAt = time.Now()
	return nil
}
