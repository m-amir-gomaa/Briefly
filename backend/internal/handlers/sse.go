package handlers

import (
	"context"
	"fmt"
	"io"

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

	// Create a Redis PubSub subscription
	channel := fmt.Sprintf("intake:events:%s", intakeID)
	pubsub := db.Redis.Subscribe(context.Background(), channel)
	defer pubsub.Close()

	clientGone := c.Writer.CloseNotify()

	c.Stream(func(w io.Writer) bool {
		select {
		case <-clientGone:
			return false
		case msg := <-pubsub.Channel():
			c.SSEvent("message", msg.Payload)
			return true
		}
	})
}
