package models

import (
	"testing"
	"time"
)

func TestRole_IsValid(t *testing.T) {
	tests := []struct {
		role     Role
		expected bool
	}{
		{UserRole, true},
		{AdminRole, true},
		{"superadmin", false},
		{"", false},
	}

	for _, tt := range tests {
		if tt.role.IsValid() != tt.expected {
			t.Errorf("expected %v for role %q, got %v", tt.expected, tt.role, tt.role.IsValid())
		}
	}
}

func TestStatus_IsValid(t *testing.T) {
	tests := []struct {
		status   Status
		expected bool
	}{
		{StatusActive, true},
		{StatusInactive, true},
		{StatusSuspended, true},
		{"banned", false},
	}

	for _, tt := range tests {
		if tt.status.IsValid() != tt.expected {
			t.Errorf("expected %v for status %q, got %v", tt.expected, tt.status, tt.status.IsValid())
		}
	}
}

func TestUser_SetPasswordAndCheckPassword(t *testing.T) {
	user := &User{}
	password := "securePassword"

	err := user.SetPassword(password)
	if err != nil {
		t.Fatalf("SetPassword failed: %v", err)
	}

	if user.PasswordHash == "" {
		t.Error("PasswordHashed not set")
	}

	if !user.CheckPassword(password) {
		t.Error("CheckPassword failed with correct password")
	}

	if user.CheckPassword("wrongPassword") {
		t.Error("CheckPassword passed with wrong password")
	}
}

func TestUser_ToResponse(t *testing.T) {
	now := time.Now()
	phone := "123456789"

	user := User{
		ID:        1,
		Name:      "Test User",
		Email:     "test@example.com",
		Phone:     &phone,
		Role:      UserRole,
		Status:    StatusActive,
		CreatedAt: now,
	}

	resp := user.ToResponse()
	if resp.ID != user.ID || resp.Email != user.Email || resp.Status != user.Status {
		t.Error("ToResponse does not match user fields")
	}
}
