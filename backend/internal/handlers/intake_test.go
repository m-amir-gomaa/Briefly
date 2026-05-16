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
	"github.com/softworks/briefly-backend/internal/repository"
	"github.com/softworks/briefly-backend/internal/service"
	"github.com/stretchr/testify/assert"
)

func setupIntakeHandler(t *testing.T) *handlers.IntakeHandler {
	intakeRepo := repository.NewIntakeRepository(db.DB)
	intakeSvc := service.NewIntakeService(intakeRepo, db.Redis)
	return handlers.NewIntakeHandler(intakeSvc, intakeRepo)
}

func TestSubmitIntake(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mock, err := db.SetupMockDB()
	assert.NoError(t, err)

	mr, err := db.SetupMockRedis()
	assert.NoError(t, err)
	defer mr.Close()

	db.SetupMockS3()

	h := setupIntakeHandler(t)
	r := gin.Default()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", uuid.New().String())
		c.Next()
	})
	r.POST("/intake", h.SubmitIntake)

	t.Run("Valid Text Intake", func(t *testing.T) {
		// Mock finding the demo user
		userRows := sqlmock.NewRows([]string{"id", "gemini_api_key"}).AddRow(uuid.New(), "key")
		mock.ExpectQuery(`SELECT \* FROM "users" WHERE id = \$1 ORDER BY "users"\."id" LIMIT \$2`).
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

	h := setupIntakeHandler(t)
	r := gin.Default()
	r.PATCH("/intake/:id/confirm", h.UpdateIntakeResults)

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

		// Mock internal key
		internalKey := "test_key"
		t.Setenv("INTERNAL_SERVICE_KEY", internalKey)

		// Mock updating intake status
		mock.ExpectBegin()
		mock.ExpectExec(`UPDATE "intakes" SET "status"=\$1,"updated_at"=\$2 WHERE id = \$3`).
			WithArgs("COMPLETED", sqlmock.AnyArg(), intakeID.String()).
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
		req.Header.Set("Internal-Service-Key", internalKey)

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}
