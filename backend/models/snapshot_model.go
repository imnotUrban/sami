package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// DiagramSnapshot represents the diagram_versions table structure
type DiagramSnapshot struct {
	ID         uint            `json:"id" gorm:"primaryKey"`
	ProjectID  uint            `json:"project_id" gorm:"not null"`
	Project    Project         `json:"-" gorm:"foreignKey:ProjectID"`
	VersionNum int             `json:"version_num" gorm:"not null"`
	Snapshot   json.RawMessage `json:"snapshot" gorm:"type:jsonb;not null"`
	CreatedBy  uint            `json:"created_by" gorm:"not null"`
	User       User            `json:"-" gorm:"foreignKey:CreatedBy"`
	CreatedAt  time.Time       `json:"created_at" gorm:"not null;default:now()"`
	Notes      string          `json:"notes" gorm:"type:text"`
}

// CreateSnapshotRequest represents snapshot creation data
type CreateSnapshotRequest struct {
	Notes string `json:"notes"`
}

// RestoreSnapshotRequest represents snapshot restoration data
type RestoreSnapshotRequest struct {
	Force bool `json:"force"` // Force restoration even if there are conflicts
}

// SnapshotResponse represents snapshot response
type SnapshotResponse struct {
	ID         uint            `json:"id"`
	ProjectID  uint            `json:"project_id"`
	VersionNum int             `json:"version_num"`
	Snapshot   json.RawMessage `json:"snapshot"`
	CreatedBy  uint            `json:"created_by"`
	User       UserResponse    `json:"user"`
	CreatedAt  time.Time       `json:"created_at"`
	Notes      string          `json:"notes"`
}

// ToResponse converts DiagramSnapshot to SnapshotResponse
func (ds *DiagramSnapshot) ToResponse() SnapshotResponse {
	response := SnapshotResponse{
		ID:         ds.ID,
		ProjectID:  ds.ProjectID,
		VersionNum: ds.VersionNum,
		Snapshot:   ds.Snapshot,
		CreatedBy:  ds.CreatedBy,
		CreatedAt:  ds.CreatedAt,
		Notes:      ds.Notes,
	}

	// Include user if loaded
	if ds.User.ID != 0 {
		response.User = ds.User.ToResponse()
	}

	return response
}

// TableName specifies the table name for DiagramSnapshot
func (DiagramSnapshot) TableName() string {
	return "diagram_versions"
}

// BeforeCreate runs before creating a snapshot
func (ds *DiagramSnapshot) BeforeCreate(tx *gorm.DB) error {
	if ds.CreatedAt.IsZero() {
		ds.CreatedAt = time.Now()
	}
	return nil
}
