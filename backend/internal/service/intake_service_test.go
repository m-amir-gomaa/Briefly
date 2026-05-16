package service_test

import (
	"context"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/softworks/briefly-backend/internal/models"
	"github.com/softworks/briefly-backend/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockIntakeRepository is a mock of the IntakeRepository interface
type MockIntakeRepository struct {
	mock.Mock
}

func (m *MockIntakeRepository) Create(intake *models.Intake) error {
	args := m.Called(intake)
	return args.Error(0)
}

func (m *MockIntakeRepository) GetByID(id string) (*models.Intake, error) {
	args := m.Called(id)
	return args.Get(0).(*models.Intake), args.Error(1)
}

func (m *MockIntakeRepository) ListByUserID(userID string) ([]models.Intake, error) {
	args := m.Called(userID)
	return args.Get(0).([]models.Intake), args.Error(1)
}

func (m *MockIntakeRepository) UpdateStatus(id string, status models.IntakeStatus) error {
	args := m.Called(id, status)
	return args.Error(0)
}

func TestIntakeService_Submit(t *testing.T) {
	// Setup miniredis
	mr, err := miniredis.Run()
	assert.NoError(t, err)
	defer mr.Close()

	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	repo := new(MockIntakeRepository)
	svc := service.NewIntakeService(repo, rdb)

	ctx := context.Background()
	userID := uuid.New()
	rawText := "Test project text"

	t.Run("Successfully submit text intake", func(t *testing.T) {
		repo.On("Create", mock.AnythingOfType("*models.Intake")).Return(nil)

		intake, err := svc.Submit(ctx, userID, rawText, "", "", "gemini-key")

		assert.NoError(t, err)
		assert.NotNil(t, intake)
		assert.Equal(t, models.IntakeTypeText, intake.Type)
		assert.Equal(t, rawText, intake.RawText)
		
		// Verify Redis enqueuing
		val, err := rdb.LPop(ctx, "intake:queue").Result()
		assert.NoError(t, err)
		assert.Contains(t, val, intake.ID.String())
		
		repo.AssertExpectations(t)
	})
}
