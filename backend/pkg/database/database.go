package database

import (
	"fmt"

	"sami/pkg/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func NewConnection(cfg config.DatabaseConfig) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.URL), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return db, nil
}

func Migrate(db *gorm.DB, models ...interface{}) error {
	return db.AutoMigrate(models...)
}
