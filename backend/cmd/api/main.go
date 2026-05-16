package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/handlers"
	"github.com/softworks/briefly-backend/internal/models"
	"github.com/softworks/briefly-backend/internal/repository"
	"github.com/softworks/briefly-backend/internal/service"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func main() {
	// Initialize database and Redis
	db.Init()

	// Use a local session for migration to avoid tainting global state
	err := db.DB.Session(&gorm.Session{}).AutoMigrate(
		&models.User{},
		&models.Intake{},
		&models.Brief{},
		&models.Feedback{},
	)
	if err != nil {
		log.Printf("Migration warning: %v. Continuing initialization...", err)
	}

	ensureDemoUser("demo@briefly.ai", "Briefly Demo")
	ensureDemoUser("demo@softworks.ai", "Softworks Studio")
	
	// Initialize Repository & Service Layers
	intakeRepo := repository.NewIntakeRepository(db.DB)
	intakeSvc := service.NewIntakeService(intakeRepo, db.Redis)
	intakeHandler := handlers.NewIntakeHandler(intakeSvc, intakeRepo)

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
		// Auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.POST("/logout", handlers.Logout)
			auth.GET("/google", handlers.GoogleLogin)
			auth.GET("/google/callback", handlers.GoogleCallback)

			// Protected auth routes
			authProtected := auth.Group("")
			authProtected.Use(handlers.AuthMiddleware())
			{
				authProtected.GET("/me", handlers.GetMe)
				authProtected.PATCH("/me", handlers.UpdateProfile)
			}
		}

		protected := v1.Group("")
		protected.Use(handlers.AuthMiddleware())
		{
			protected.GET("/intakes", intakeHandler.ListIntakes)
			protected.GET("/briefs", handlers.ListBriefs)
			protected.POST("/intake", intakeHandler.SubmitIntake)
			protected.GET("/intake/:id", intakeHandler.GetIntakeStatus)
			protected.POST("/billing/create-checkout", handlers.CreateCheckoutSession)
		}

		// Webhooks (unprotected)
		v1.POST("/billing/webhook", handlers.StripeWebhook)
		v1.PATCH("/intake/:id/confirm", intakeHandler.UpdateIntakeResults)

		// Public Brief routes
		v1.GET("/public/brief/:token", handlers.GetPublicBrief)
		v1.POST("/public/brief/:token/confirm", handlers.ConfirmBrief)

		// SSE endpoint
		v1.GET("/events/:intake_id", handlers.SSEHandler)

		// Metrics endpoint
		r.GET("/metrics", gin.WrapH(promhttp.Handler()))
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

func ensureDemoUser(email, agencyName string) {
	apiKey := os.Getenv("BRIEFLY_DEMO_GEMINI_API_KEY")
	passwordHash, err := bcrypt.GenerateFromPassword([]byte("briefly-demo"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to hash demo password for %s: %v", email, err)
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
		user = models.User{
			Email:        email,
			AgencyName:   agencyName,
			PasswordHash: string(passwordHash),
			GeminiAPIKey: apiKey,
			PlanTier:     "free",
		}
		if err := db.DB.Create(&user).Error; err != nil {
			log.Printf("Failed to create demo user %s: %v", email, err)
			return
		}
		log.Printf("Created default demo user: %s", email)
		return
	}

	updates := map[string]interface{}{}
	if user.PasswordHash == "" || user.PasswordHash == "hashed_password" {
		updates["password_hash"] = string(passwordHash)
	}
	if apiKey != "" {
		updates["gemini_api_key"] = apiKey
	}
	if user.PlanTier == "" {
		updates["plan_tier"] = "free"
	}
	if len(updates) > 0 {
		db.DB.Model(&user).Updates(updates)
	}
}
