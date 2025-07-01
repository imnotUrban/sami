package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"sami/controller"
	"sami/models"
	"sami/routes"
)

var DB *gorm.DB

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println(".env file not found")
	}

	// Connect to database
	connectDatabase()

	// Configure Gin
	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Pass DB instance to controllers
	authController := &controller.AuthController{DB: DB}
	projectController := &controller.ProjectController{DB: DB}
	serviceController := &controller.ServiceController{DB: DB}
	dependencyController := &controller.DependencyController{DB: DB}
	commentController := &controller.CommentController{DB: DB}
	adminController := &controller.AdminController{DB: DB}

	// Setup routes
	routes.SetupAuthRoutes(r, authController)
	routes.SetupProjectRoutes(r, projectController, authController)
	routes.SetupServiceRoutes(r, serviceController, authController)
	routes.SetupDependencyRoutes(r, dependencyController, authController)
	routes.SetupCommentRoutes(r, commentController, authController)
	routes.SetupAdminRoutes(r, adminController, authController)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server started on port %s", port)
	log.Fatal(r.Run(":" + port))
}

func connectDatabase() {
	// Get database configuration from environment variables
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=your_password dbname=microdocs port=5432 sslmode=disable TimeZone=UTC"
	}

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	DB = database

	// Auto migration - migrate all models
	DB.AutoMigrate(&models.User{})

	log.Println("Database connected successfully")
}
