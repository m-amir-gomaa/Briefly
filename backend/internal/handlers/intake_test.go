package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/handlers"
	"github.com/stretchr/testify/assert"
)

func TestSubmitIntake(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mock, err := db.SetupMockDB()
	assert.NoError(t, err)

	mr, err := db.SetupMockRedis()
	assert.NoError(t, err)
	defer mr.Close()

	db.SetupMockS3()

	r := gin.Default()
	r.POST("/intake", handlers.SubmitIntake)

	t.Run("Valid Text Intake", func(t *testing.T) {
		// Mock finding the demo user
		userID := uuid.New()
		userRows := sqlmock.NewRows([]string{"id"}).AddRow(userID)
		mock.ExpectQuery(`SELECT \* FROM "users" ORDER BY "users"\."id" LIMIT \$1`).
			WithArgs(1).
			WillReturnRows(userRows)

		// Mock creating the intake
		mock.ExpectBegin()
		mock.ExpectQuery(`INSERT INTO "intakes" .* RETURNING "id"`).
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(uuid.New()))
		mock.ExpectCommit()

		// Create multipart form body
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)
		_ = writer.WriteField("raw_text", "test input")
		_ = writer.WriteField("has_audio", "false")
		_ = writer.WriteField("has_image", "false")
		writer.Close()

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/intake", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusAccepted, w.Code)
		
		// Verify Redis queue received the job
		queueLen, err := db.Redis.LLen(context.Background(), "intake:queue").Result()
		assert.NoError(t, err)
		assert.Equal(t, int64(1), queueLen)
	})
}

func TestUpdateIntakeResults(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mock, err := db.SetupMockDB()
	assert.NoError(t, err)

	r := gin.Default()
	r.PATCH("/intake/:id/confirm", handlers.UpdateIntakeResults)

	t.Run("Valid Update", func(t *testing.T) {
		intakeID := uuid.New()
		reqBody, _ := json.Marshal(map[string]interface{}{
			"summary": "test summary",
			"confidence_score": 0.95,
			"goals": []map[string]string{{"title": "t", "detail": "d"}},
			"success_criteria": []string{"c1"},
			"ambiguities": []map[string]string{},
			"followup_questions": []string{},
			"tone_profile": "casual",
		})

		// Mock updating intake status
		mock.ExpectBegin()
		mock.ExpectExec(`UPDATE "intakes" SET "status"=\$1,"updated_at"=\$2 WHERE id = \$3`).
			WithArgs("COMPLETED", sqlmock.AnyArg(), intakeID).
			WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		// Mock creating brief
		mock.ExpectBegin()
		mock.ExpectQuery(`INSERT INTO "briefs" .* RETURNING "id"`).
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(uuid.New()))
		mock.ExpectCommit()

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PATCH", "/intake/"+intakeID.String()+"/confirm", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}
