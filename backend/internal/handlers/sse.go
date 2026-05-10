package handlers

import (
	"context"
	"fmt"
	"io"
	"log"
	"time"

	"github.com/gin-gonic/gin"

	"briefly/backend/internal/db"
)

// SSEHandler handles GET /api/v1/events/:intake_id
// Subscribes to Redis Pub-Sub channel and streams events to client.
func SSEHandler(c *gin.Context) {
	intakeID := c.Param("intake_id")
	channel := fmt.Sprintf("intake:events:%s", intakeID)

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Minute)
	defer cancel()

	pubsub := db.Redis.Subscribe(ctx, channel)
	defer pubsub.Close()

	log.Printf("📡 SSE client subscribed to %s", channel)

	// Send initial connection event
	fmt.Fprintf(c.Writer, "event: connected\ndata: {\"channel\":\"%s\"}\n\n", channel)
	c.Writer.Flush()

	ch := pubsub.Channel()

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				return
			}
			fmt.Fprintf(c.Writer, "data: %s\n\n", msg.Payload)
			c.Writer.Flush()

			if msg.Payload == "COMPLETED" || msg.Payload == "FAILED" {
				log.Printf("📡 SSE stream closed for %s (status=%s)", intakeID, msg.Payload)
				return
			}

		case <-ctx.Done():
			log.Printf("📡 SSE stream timeout for %s", intakeID)
			return

		case <-c.Writer.(io.Closer).(*gin.ResponseWriter):
			log.Printf("📡 SSE client disconnected from %s", intakeID)
			return
		}
	}
}
