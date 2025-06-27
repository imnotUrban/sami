package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// ChangeHistory represents the change_history table structure
type ChangeHistory struct {
	ID        uint            `json:"id" gorm:"primaryKey"`
	ProjectID uint            `json:"project_id" gorm:"not null"`
	Project   Project         `json:"-" gorm:"foreignKey:ProjectID"`
	ServiceID *uint           `json:"service_id"`
	Service   *Service        `json:"-" gorm:"foreignKey:ServiceID"`
	UserID    uint            `json:"user_id" gorm:"not null"`
	User      User            `json:"-" gorm:"foreignKey:UserID"`
	Action    string          `json:"action" gorm:"not null;size:50"`
	Details   json.RawMessage `json:"details" gorm:"type:jsonb"`
	Timestamp time.Time       `json:"timestamp" gorm:"not null;default:now()"`
}

// HistoryResponse represents change history response
type HistoryResponse struct {
	ID        uint             `json:"id"`
	ProjectID uint             `json:"project_id"`
	ServiceID *uint            `json:"service_id"`
	Service   *ServiceResponse `json:"service,omitempty"`
	UserID    uint             `json:"user_id"`
	User      UserResponse     `json:"user"`
	Action    string           `json:"action"`
	Details   json.RawMessage  `json:"details"`
	Timestamp time.Time        `json:"timestamp"`
}

// ToResponse converts ChangeHistory to HistoryResponse
func (ch *ChangeHistory) ToResponse() HistoryResponse {
	response := HistoryResponse{
		ID:        ch.ID,
		ProjectID: ch.ProjectID,
		ServiceID: ch.ServiceID,
		UserID:    ch.UserID,
		Action:    ch.Action,
		Details:   ch.Details,
		Timestamp: ch.Timestamp,
	}

	// Include user if loaded
	if ch.User.ID != 0 {
		response.User = ch.User.ToResponse()
	}

	// Include service if loaded and exists
	if ch.Service != nil && ch.Service.ID != 0 {
		serviceResponse := ch.Service.ToResponse()
		response.Service = &serviceResponse
	}

	return response
}

// TableName specifies the table name for ChangeHistory
func (ChangeHistory) TableName() string {
	return "change_history"
}

// BeforeCreate runs before creating a history entry
func (ch *ChangeHistory) BeforeCreate(tx *gorm.DB) error {
	if ch.Timestamp.IsZero() {
		ch.Timestamp = time.Now()
	}
	return nil
}

// CreateHistoryEntry creates a new history entry
func CreateHistoryEntry(db *gorm.DB, projectID uint, serviceID *uint, userID uint, action string, details interface{}) error {
	detailsJSON, err := json.Marshal(details)
	if err != nil {
		return err
	}

	history := ChangeHistory{
		ProjectID: projectID,
		ServiceID: serviceID,
		UserID:    userID,
		Action:    action,
		Details:   detailsJSON,
	}

	return db.Create(&history).Error
}
