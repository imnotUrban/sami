package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// Project represents the project structure in the database
type Project struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null;size:100"`
	Slug        string    `json:"slug" gorm:"unique;not null;size:100"`
	Description string    `json:"description" gorm:"type:text"`
	OwnerID     uint      `json:"owner_id" gorm:"not null"`
	Owner       User      `json:"-" gorm:"foreignKey:OwnerID"`
	Visibility  string    `json:"visibility" gorm:"default:private;size:20"`
	Status      string    `json:"status" gorm:"default:active;size:20"`
	CreatedAt   time.Time `json:"created_at" gorm:"not null;default:now()"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"not null;default:now()"`

	// Collaborators relationship
	Collaborators []ProjectCollaborator `json:"-" gorm:"foreignKey:ProjectID"`
}

// ProjectCollaborator represents the project collaborators structure
type ProjectCollaborator struct {
	ProjectID uint      `json:"project_id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"primaryKey"`
	Project   Project   `json:"-" gorm:"foreignKey:ProjectID"`
	User      User      `json:"-" gorm:"foreignKey:UserID"`
	Role      string    `json:"role" gorm:"default:editor;size:50"`
	JoinedAt  time.Time `json:"joined_at" gorm:"default:now()"`
	State     string    `json:"state" gorm:"default:active;size:20"`
}

// CreateProjectRequest represents project creation data
type CreateProjectRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=100"`
	Slug        string `json:"slug" binding:"required,min=2,max=100"`
	Description string `json:"description"`
	Visibility  string `json:"visibility" binding:"omitempty,oneof=private public"`
}

// UpdateProjectRequest represents project update data
type UpdateProjectRequest struct {
	Name        string `json:"name" binding:"omitempty,min=2,max=100"`
	Description string `json:"description"`
	Visibility  string `json:"visibility" binding:"omitempty,oneof=private public"`
	Status      string `json:"status" binding:"omitempty,oneof=active archived"`
}

// AddCollaboratorRequest represents adding collaborator data
type AddCollaboratorRequest struct {
	Email string `json:"email" binding:"required,email"`
	Role  string `json:"role" binding:"omitempty,oneof=owner editor viewer"`
}

// ProjectResponse represents project response
type ProjectResponse struct {
	ID            uint                   `json:"id"`
	Name          string                 `json:"name"`
	Slug          string                 `json:"slug"`
	Description   string                 `json:"description"`
	OwnerID       uint                   `json:"owner_id"`
	Owner         UserResponse           `json:"owner"`
	Visibility    string                 `json:"visibility"`
	Status        string                 `json:"status"`
	CreatedAt     time.Time              `json:"created_at"`
	UpdatedAt     time.Time              `json:"updated_at"`
	Collaborators []CollaboratorResponse `json:"collaborators,omitempty"`
}

// CollaboratorResponse represents collaborator response
type CollaboratorResponse struct {
	UserID   uint         `json:"user_id"`
	User     UserResponse `json:"user"`
	Role     string       `json:"role"`
	JoinedAt time.Time    `json:"joined_at"`
	State    string       `json:"state"`
}

// ToResponse converts project to ProjectResponse
func (p *Project) ToResponse() ProjectResponse {
	response := ProjectResponse{
		ID:          p.ID,
		Name:        p.Name,
		Slug:        p.Slug,
		Description: p.Description,
		OwnerID:     p.OwnerID,
		Visibility:  p.Visibility,
		Status:      p.Status,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}

	// Include owner if loaded
	if p.Owner.ID != 0 {
		response.Owner = p.Owner.ToResponse()
	}

	// Convert collaborators if loaded
	for _, collab := range p.Collaborators {
		response.Collaborators = append(response.Collaborators, collab.ToResponse())
	}

	return response
}

// ToResponse converts collaborator to CollaboratorResponse
func (pc *ProjectCollaborator) ToResponse() CollaboratorResponse {
	response := CollaboratorResponse{
		UserID:   pc.UserID,
		Role:     pc.Role,
		JoinedAt: pc.JoinedAt,
		State:    pc.State,
	}

	// Include user if loaded
	if pc.User.ID != 0 {
		response.User = pc.User.ToResponse()
	}

	return response
}

// TableName specifies the table name for Project
func (Project) TableName() string {
	return "projects"
}

// TableName specifies the table name for ProjectCollaborator
func (ProjectCollaborator) TableName() string {
	return "project_collaborators"
}

// BeforeCreate runs before creating a project
func (p *Project) BeforeCreate(tx *gorm.DB) error {
	if p.CreatedAt.IsZero() {
		p.CreatedAt = time.Now()
	}
	if p.UpdatedAt.IsZero() {
		p.UpdatedAt = time.Now()
	}
	return nil
}

// BeforeUpdate runs before updating a project
func (p *Project) BeforeUpdate(tx *gorm.DB) error {
	p.UpdatedAt = time.Now()
	return nil
}

// BeforeCreate runs before creating a collaborator
func (pc *ProjectCollaborator) BeforeCreate(tx *gorm.DB) error {
	if pc.JoinedAt.IsZero() {
		pc.JoinedAt = time.Now()
	}
	return nil
}

// BulkSaveRequest represents bulk save operations for a project
type BulkSaveRequest struct {
	Services            []CreateServiceRequest    `json:"services"`
	Dependencies        []CreateDependencyRequest `json:"dependencies"`
	UpdatedServices     []UpdateServiceRequest    `json:"updated_services"`
	UpdatedDependencies []UpdateDependencyRequest `json:"updated_dependencies"`
	DeletedServices     []uint                    `json:"deleted_services"`
	DeletedDependencies []uint                    `json:"deleted_dependencies"`
}

// BulkSaveResult represents the result of bulk save operations
type BulkSaveResult struct {
	CreatedServices          []ServiceResponse    `json:"created_services"`
	CreatedDependencies      []DependencyResponse `json:"created_dependencies"`
	UpdatedServices          []ServiceResponse    `json:"updated_services"`
	UpdatedDependencies      []DependencyResponse `json:"updated_dependencies"`
	DeletedServicesCount     int                  `json:"deleted_services_count"`
	DeletedDependenciesCount int                  `json:"deleted_dependencies_count"`
}

// ExecuteBulkSave handles bulk save operations in a transaction
func ExecuteBulkSave(tx *gorm.DB, projectID uint, userID uint, req BulkSaveRequest) (*BulkSaveResult, error) {
	result := &BulkSaveResult{
		CreatedServices:     make([]ServiceResponse, 0),
		CreatedDependencies: make([]DependencyResponse, 0),
		UpdatedServices:     make([]ServiceResponse, 0),
		UpdatedDependencies: make([]DependencyResponse, 0),
	}

	// Step 1: Delete dependencies first (to avoid foreign key constraints)
	if len(req.DeletedDependencies) > 0 {
		deleteResult := tx.Where("id IN ?", req.DeletedDependencies).Delete(&Dependency{})
		if deleteResult.Error != nil {
			return nil, fmt.Errorf("failed to delete dependencies: %v", deleteResult.Error)
		}
		result.DeletedDependenciesCount = int(deleteResult.RowsAffected)
	}

	// Step 2: Delete services
	if len(req.DeletedServices) > 0 {
		deleteResult := tx.Where("id IN ?", req.DeletedServices).Delete(&Service{})
		if deleteResult.Error != nil {
			return nil, fmt.Errorf("failed to delete services: %v", deleteResult.Error)
		}
		result.DeletedServicesCount = int(deleteResult.RowsAffected)
	}

	// Step 3: Update existing services
	for _, updateReq := range req.UpdatedServices {
		var service Service
		if err := tx.Where("project_id = ?", projectID).First(&service, updateReq.ID).Error; err != nil {
			return nil, fmt.Errorf("service not found for update: %v", err)
		}

		// Update fields only if they are provided and valid
		if updateReq.Name != "" {
			service.Name = updateReq.Name
		}
		if updateReq.Description != "" {
			service.Description = updateReq.Description
		}
		if updateReq.Type != "" {
			service.Type = updateReq.Type
		}
		if updateReq.Status != "" {
			service.Status = updateReq.Status
		}
		if updateReq.Version != "" {
			service.Version = updateReq.Version
		}
		if updateReq.Language != "" {
			service.Language = updateReq.Language
		}
		if updateReq.Environment != "" {
			service.Environment = updateReq.Environment
		}
		if updateReq.DeployURL != "" {
			service.DeployURL = updateReq.DeployURL
		}
		if updateReq.Domain != "" {
			service.Domain = updateReq.Domain
		}
		if updateReq.GitRepo != "" {
			service.GitRepo = updateReq.GitRepo
		}
		if updateReq.Notes != "" {
			service.Notes = updateReq.Notes
		}
		if updateReq.HealthMetrics != nil {
			service.HealthMetrics = updateReq.HealthMetrics
		}
		if updateReq.Metadata != nil {
			service.Metadata = updateReq.Metadata
		}
		// Always update position
		service.PosX = updateReq.PosX
		service.PosY = updateReq.PosY
		service.UpdatedBy = &userID

		if err := tx.Save(&service).Error; err != nil {
			return nil, fmt.Errorf("failed to update service: %v", err)
		}

		result.UpdatedServices = append(result.UpdatedServices, service.ToResponse())
	}

	// Step 4: Create new services
	for _, serviceReq := range req.Services {
		service := Service{
			ProjectID:     projectID,
			Name:          serviceReq.Name,
			Description:   serviceReq.Description,
			Type:          serviceReq.Type,
			Status:        serviceReq.Status,
			Version:       serviceReq.Version,
			Language:      serviceReq.Language,
			Environment:   serviceReq.Environment,
			DeployURL:     serviceReq.DeployURL,
			Domain:        serviceReq.Domain,
			GitRepo:       serviceReq.GitRepo,
			HealthMetrics: serviceReq.HealthMetrics,
			Metadata:      serviceReq.Metadata,
			PosX:          serviceReq.PosX,
			PosY:          serviceReq.PosY,
			Notes:         serviceReq.Notes,
			CreatedBy:     userID,
		}

		if err := tx.Create(&service).Error; err != nil {
			return nil, fmt.Errorf("failed to create service: %v", err)
		}

		result.CreatedServices = append(result.CreatedServices, service.ToResponse())
	}

	// Step 5: Update existing dependencies
	for _, updateReq := range req.UpdatedDependencies {
		var dependency Dependency
		if err := tx.First(&dependency, updateReq.ID).Error; err != nil {
			return nil, fmt.Errorf("dependency not found for update: %v", err)
		}

		// Update fields only if they are provided
		if updateReq.Type != "" {
			dependency.Type = updateReq.Type
		}
		if updateReq.Description != "" {
			dependency.Description = updateReq.Description
		}
		if updateReq.Protocol != "" {
			dependency.Protocol = updateReq.Protocol
		}
		if updateReq.Method != "" {
			dependency.Method = updateReq.Method
		}
		dependency.UpdatedBy = &userID

		if err := tx.Save(&dependency).Error; err != nil {
			return nil, fmt.Errorf("failed to update dependency: %v", err)
		}

		result.UpdatedDependencies = append(result.UpdatedDependencies, dependency.ToResponse())
	}

	// Step 6: Create new dependencies (after all services exist)
	for _, depReq := range req.Dependencies {
		// Validate that both source and target services exist
		var sourceService, targetService Service
		if err := tx.Where("project_id = ?", projectID).First(&sourceService, depReq.SourceID).Error; err != nil {
			return nil, fmt.Errorf("source service not found: %v", err)
		}
		if err := tx.Where("project_id = ?", projectID).First(&targetService, depReq.TargetID).Error; err != nil {
			return nil, fmt.Errorf("target service not found: %v", err)
		}

		dependency := Dependency{
			SourceID:    depReq.SourceID,
			TargetID:    depReq.TargetID,
			Type:        depReq.Type,
			Description: depReq.Description,
			Protocol:    depReq.Protocol,
			Method:      depReq.Method,
			CreatedBy:   userID,
		}

		if err := tx.Create(&dependency).Error; err != nil {
			return nil, fmt.Errorf("failed to create dependency: %v", err)
		}

		result.CreatedDependencies = append(result.CreatedDependencies, dependency.ToResponse())
	}

	return result, nil
}
