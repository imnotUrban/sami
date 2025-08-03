package main

import (
	"fmt"
	"log"

	"sami/controller"
	"sami/internal/middlware"
	"sami/models"
	"sami/pkg/config"
	"sami/pkg/database"
	"sami/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println(".env file not found")
	}
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Error config: %v", err)
	}

	db, err := database.NewConnection(cfg.Database)
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}

	// TODO - Add validation that it only runs in development mode
	if err = database.Migrate(db, &models.User{}); err != nil {
		log.Fatalf("Error migrating database: %v", err)
	}

	// Configure Gin
	r := gin.Default()

	// CORS Middleware
	r.Use(middlware.Cors(cfg.Server))

	// Pass DB instance to controllers
	authController := &controller.AuthController{DB: db}
	projectController := &controller.ProjectController{DB: db}
	serviceController := &controller.ServiceController{DB: db}
	dependencyController := &controller.DependencyController{DB: db}
	commentController := &controller.CommentController{DB: db}
	adminController := &controller.AdminController{DB: db}

	// Setup routes
	routes.SetupAuthRoutes(r, authController)
	routes.SetupProjectRoutes(r, projectController, authController)
	routes.SetupServiceRoutes(r, serviceController, authController)
	routes.SetupDependencyRoutes(r, dependencyController, authController)
	routes.SetupCommentRoutes(r, commentController, authController)
	routes.SetupAdminRoutes(r, adminController, authController)

	// Start server
	if err = r.Run(fmt.Sprintf(":%d", cfg.Server.Port)); err != nil {
		log.Fatal(err)
	}
}
