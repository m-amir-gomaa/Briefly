package repository_test

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/models"
	"github.com/softworks/briefly-backend/internal/repository"
	"github.com/stretchr/testify/assert"
)

func TestIntakeRepository(t *testing.T) {
	mock, err := db.SetupMockDB()
	assert.NoError(t, err)

	repo := repository.NewIntakeRepository(db.DB)

	t.Run("Create Intake", func(t *testing.T) {
		intake := &models.Intake{
			UserID:  uuid.New(),
			RawText: "Test",
		}

		mock.ExpectBegin()
		mock.ExpectQuery(`INSERT INTO "intakes" .* RETURNING "id"`).
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(uuid.New()))
		mock.ExpectCommit()

		err := repo.Create(intake)
		assert.NoError(t, err)
		mock.ExpectationsWereMet()
	})

	t.Run("Get Intake By ID", func(t *testing.T) {
		id := uuid.New()
		rows := sqlmock.NewRows([]string{"id", "raw_text"}).AddRow(id, "Test content")
		
		mock.ExpectQuery(`SELECT \* FROM "intakes" WHERE id = \$1 ORDER BY "intakes"\."id" LIMIT \$2`).
			WithArgs(id.String(), 1).
			WillReturnRows(rows)
		
		mock.ExpectQuery(`SELECT \* FROM "briefs" WHERE "briefs"\."intake_id" = \$1`).
			WithArgs(id.String()).
			WillReturnRows(sqlmock.NewRows([]string{"id", "intake_id"}))

		intake, err := repo.GetByID(id.String())
		assert.NoError(t, err)
		assert.Equal(t, "Test content", intake.RawText)
	})
}
