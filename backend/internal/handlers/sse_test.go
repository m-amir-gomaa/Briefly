package handlers_test

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/handlers"
	"github.com/stretchr/testify/assert"
)

func TestSSEHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mr, err := db.SetupMockRedis()
	assert.NoError(t, err)
	defer mr.Close()

	r := gin.Default()
	r.GET("/events/:intake_id", handlers.SSEHandler)

	t.Run("Streams Events", func(t *testing.T) {
		intakeID := uuid.New().String()
		channel := fmt.Sprintf("intake:events:%s", intakeID)

		ts := httptest.NewServer(r)
		defer ts.Close()

		ctx, cancel := context.WithCancel(context.Background())
		req, _ := http.NewRequestWithContext(ctx, "GET", ts.URL+"/events/"+intakeID, nil)

		// Publish a message to miniredis in a goroutine so the handler can pick it up
		go func() {
			time.Sleep(50 * time.Millisecond) // Give the handler time to subscribe
			mr.Publish(channel, "PROCESSING")
			time.Sleep(50 * time.Millisecond) // Give the handler time to write the SSE
			cancel() // Disconnect client to end the handler loop
		}()

		resp, err := http.DefaultClient.Do(req)
		// We expect an error here due to context cancellation
		if resp != nil && resp.Body != nil {
			defer resp.Body.Close()
			buf := new(strings.Builder)
			_, _ = io.Copy(buf, resp.Body)
			assert.Contains(t, buf.String(), "event:message\ndata:PROCESSING\n\n")
			assert.Contains(t, resp.Header.Get("Content-Type"), "text/event-stream")
		} else {
			assert.Error(t, err)
		}
	})
}
