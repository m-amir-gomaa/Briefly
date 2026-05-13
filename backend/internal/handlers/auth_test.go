package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/handlers"
	"github.com/stretchr/testify/assert"
)

func TestLogin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	os.Setenv("JWT_SECRET", "test_secret") // Needed for token generation

	mock, err := db.SetupMockDB()
	assert.NoError(t, err)

	r := gin.Default()
	r.POST("/login", handlers.Login)

	t.Run("Valid Login", func(t *testing.T) {
		reqBody, _ := json.Marshal(map[string]string{
			"email":    "test@test.com",
			"password": "password",
		})
		
		userID := uuid.New()
		
		rows := sqlmock.NewRows([]string{"id", "email", "password_hash"}).
			AddRow(userID, "test@test.com", "hash")
			
		mock.ExpectQuery(`SELECT \* FROM "users" WHERE email = \$1 ORDER BY "users"\."id" LIMIT \$2`).
			WithArgs("test@test.com", 1).
			WillReturnRows(rows)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Header().Get("Set-Cookie"), "auth_token=")
		assert.Contains(t, w.Header().Get("Set-Cookie"), "HttpOnly")
	})

	t.Run("Invalid Credentials", func(t *testing.T) {
		reqBody, _ := json.Marshal(map[string]string{
			"email":    "wrong@test.com",
			"password": "password",
		})
		
		mock.ExpectQuery(`SELECT \* FROM "users" WHERE email = \$1 ORDER BY "users"\."id" LIMIT \$2`).
			WithArgs("wrong@test.com", 1).
			WillReturnRows(sqlmock.NewRows([]string{"id"})) // No rows found

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}
