package repository

import (
	"github.com/softworks/briefly-backend/internal/models"
	"gorm.io/gorm"
)

type IntakeRepository interface {
	Create(intake *models.Intake) error
	GetByID(id string) (*models.Intake, error)
	ListByUserID(userID string) ([]models.Intake, error)
	UpdateStatus(id string, status models.IntakeStatus) error
}

type intakeRepository struct {
	db *gorm.DB
}

func NewIntakeRepository(db *gorm.DB) IntakeRepository {
	return &intakeRepository{db: db}
}

func (r *intakeRepository) Create(intake *models.Intake) error {
	return r.db.Create(intake).Error
}

func (r *intakeRepository) GetByID(id string) (*models.Intake, error) {
	var intake models.Intake
	err := r.db.Preload("Brief").First(&intake, "id = ?", id).Error
	return &intake, err
}

func (r *intakeRepository) ListByUserID(userID string) ([]models.Intake, error) {
	var intakes []models.Intake
	err := r.db.Preload("Brief").Where("user_id = ?", userID).Order("created_at desc").Find(&intakes).Error
	return intakes, err
}

func (r *intakeRepository) UpdateStatus(id string, status models.IntakeStatus) error {
	return r.db.Model(&models.Intake{}).Where("id = ?", id).Update("status", status).Error
}
