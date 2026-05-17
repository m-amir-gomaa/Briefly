package handlers

import (
	"fmt"
	"io"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/softworks/briefly-backend/internal/db"
)

// SSEHandler handles GET /api/v1/events/:intake_id
func SSEHandler(c *gin.Context) {
	intakeID := c.Param("intake_id")

	// Set headers for SSE
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no") // Prevent proxy buffering in NGINX/Caddy

	// Create a Redis PubSub subscription
	channel := fmt.Sprintf("intake:events:%s", intakeID)
	pubsub := db.Redis.Subscribe(c.Request.Context(), channel)
	defer pubsub.Close()

	// Ticker for heartbeats
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	// Stream updates with context cancellation and heartbeat guard
	c.Stream(func(w io.Writer) bool {
		select {
		case <-c.Request.Context().Done():
			return false
		case <-ticker.C:
			c.SSEvent("heartbeat", "keep-alive")
			return true
		case msg, ok := <-pubsub.Channel():
			if !ok {
				return false
			}
			c.SSEvent("message", msg.Payload)
			return true
		}
	})
}
