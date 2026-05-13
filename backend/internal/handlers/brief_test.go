package handlers_test

import (
	"bytes"
	"encoding/json"
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

func TestGetPublicBrief(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mock, err := db.SetupMockDB()
	assert.NoError(t, err)

	r := gin.Default()
	r.GET("/public/brief/:token", handlers.GetPublicBrief)

	t.Run("Valid Token", func(t *testing.T) {
		token := "valid_token"
		briefID := uuid.New()

		rows := sqlmock.NewRows([]string{"id", "share_token"}).
			AddRow(briefID, token)
			
		mock.ExpectQuery(`SELECT \* FROM "briefs" WHERE share_token = \$1 ORDER BY "briefs"\."id" LIMIT \$2`).
			WithArgs(token, 1).
			WillReturnRows(rows)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/public/brief/"+token, nil)

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("Invalid Token", func(t *testing.T) {
		token := "invalid_token"

		mock.ExpectQuery(`SELECT \* FROM "briefs" WHERE share_token = \$1 ORDER BY "briefs"\."id" LIMIT \$2`).
			WithArgs(token, 1).
			WillReturnRows(sqlmock.NewRows([]string{"id"}))

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/public/brief/"+token, nil)

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestConfirmBrief(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mock, err := db.SetupMockDB()
	assert.NoError(t, err)

	r := gin.Default()
	r.POST("/public/brief/:token/confirm", handlers.ConfirmBrief)

	t.Run("Valid Confirmation", func(t *testing.T) {
		token := "valid_token"
		briefID := uuid.New()

		reqBody, _ := json.Marshal(map[string]string{
			"client_name": "Acme Corp",
		})

		rows := sqlmock.NewRows([]string{"id", "share_token"}).
			AddRow(briefID, token)
			
		mock.ExpectQuery(`SELECT \* FROM "briefs" WHERE share_token = \$1 ORDER BY "briefs"\."id" LIMIT \$2`).
			WithArgs(token, 1).
			WillReturnRows(rows)

		mock.ExpectBegin()
		mock.ExpectExec(`UPDATE "briefs" SET "client_name"=\$1,"confirmed_at"=\$2,"is_confirmed"=\$3,"updated_at"=\$4 WHERE "id" = \$5`).
			WithArgs("Acme Corp", sqlmock.AnyArg(), true, sqlmock.AnyArg(), briefID).
			WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/public/brief/"+token+"/confirm", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}
