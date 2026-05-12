package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	"context"

	"github.com/gin-gonic/gin"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/handlers"
	"github.com/softworks/briefly-backend/internal/models"
)

func main() {
	// Initialize database and Redis
	db.Init()

	// Auto-migrate models individually (CRDB best practice)
	migrateModels := []interface{}{
		&models.User{},
		&models.Intake{},
		&models.Brief{},
		&models.Feedback{},
	}

	for _, model := range migrateModels {
		// Retry a few times if CRDB is still waking up
		for i := 0; i < 3; i++ {
			err := db.DB.AutoMigrate(model)
			if err == nil {
				break
			}
			log.Printf("Migration warning for %T (retry %d): %v", model, i+1, err)
			time.Sleep(2 * time.Second)
		}
	}

	// Create default user for demo
	var user models.User
	if err := db.DB.Where("email = ?", "demo@softworks.ai").First(&user).Error; err != nil {
		user = models.User{
			Email:       "demo@softworks.ai",
			AgencyName:  "Softworks Studio",
			PasswordHash: "hashed_password", // Placeholder
		}
		db.DB.Create(&user)
		log.Printf("Created default demo user: %s", user.ID)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := gin.Default()

	// Global Middleware
	r.Use(gin.Recovery())
	r.Use(gin.Logger())

	// CORS or other middleware would be added here

	// API v1 group
	v1 := r.Group("/api/v1")
	{
		// Intake routes
		v1.POST("/intake", handlers.SubmitIntake)
		v1.GET("/intake/:id", handlers.GetIntakeStatus)
		v1.PATCH("/intake/:id/confirm", handlers.UpdateIntakeResults)

		// Public Brief routes
		v1.GET("/public/brief/:token", handlers.GetPublicBrief)
		v1.POST("/public/brief/:token/confirm", handlers.ConfirmBrief)

		// SSE endpoint
		v1.GET("/events/:intake_id", handlers.SSEHandler)
	}

	// Create server
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// Initializing the server in a goroutine so that
	// it won't block the graceful shutdown handling below
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server with
	// a timeout of 5 seconds.
	quit := make(chan os.Signal, 1)
	// kill (no param) default send syscall.SIGTERM
	// kill -2 is syscall.SIGINT
	// kill -9 is syscall.SIGKILL but can't be caught, so no need to add it
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}
