package config

import (
	"fmt"
	"time"

	"sami/pkg/env"
)

type Config struct {
	App      AppConfig
	Server   ServerConfig
	Database DatabaseConfig
}

type AppConfig struct {
	Name string `env:"APP_NAME" default:"Sami"`
}

type ServerConfig struct {
	Port           int           `env:"SERVER_PORT" default:"8080"`
	ReadTimeout    time.Duration // TODO
	WriteTimeout   time.Duration // TODO
	AllowedOrigin  string        `env:"SERVER_ALLOWED_ORIGIN" default:"*"`
	AllowedMethods string        `env:"SERVER_ALLOWED_METHODS" default:"POST,GET,PUT,PATCH,DELETE,OPTIONS"`
}

type DatabaseConfig struct {
	URL string `env:"DATABASE_URL"`
}

func Load() (*Config, error) {
	cfg := &Config{}

	if err := env.ParseEnv(&cfg.App); err != nil {
		return nil, fmt.Errorf("error parsing App config: %v", err)
	}

	if err := env.ParseEnv(&cfg.Server); err != nil {
		return nil, fmt.Errorf("error parsing Server config: %v", err)
	}

	if err := env.ParseEnv(&cfg.Database); err != nil {
		return nil, fmt.Errorf("error parsing Database config: %v", err)
	}

	return cfg, nil
}
