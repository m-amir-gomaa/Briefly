package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"briefly/backend/internal/db"
	"briefly/backend/internal/handlers"
)

func main() {
	// ── Initialize database connections ──────────────────────
	db.InitDB()
	db.InitRedis()

	// ── Gin engine ──────────────────────────────────────────
	r := gin.Default()

	// ── CORS ────────────────────────────────────────────────
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// ── API v1 routes ───────────────────────────────────────
	v1 := r.Group("/api/v1")
	{
		// Intake endpoints
		v1.POST("/intake", handlers.SubmitIntake)
		v1.GET("/intake/:id", handlers.GetIntakeStatus)
		v1.PATCH("/intake/:id/confirm", handlers.UpdateIntakeResults)

		// Public brief endpoints
		v1.GET("/public/brief/:token", handlers.GetPublicBrief)
		v1.POST("/public/brief/:token/confirm", handlers.ConfirmBrief)

		// SSE endpoint
		v1.GET("/events/:intake_id", handlers.SSEHandler)
	}

	// ── Health check ────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "briefly-api"})
	})

	// ── Start server ────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Briefly API starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
