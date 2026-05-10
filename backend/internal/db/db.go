package db

import (
	"context"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"briefly/backend/internal/models"
)

var (
	DB    *gorm.DB
	Redis *redis.Client
)

// InitDB opens a PostgreSQL connection via GORM and runs AutoMigrate.
func InitDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://briefly:briefly_secret@localhost:5432/briefly_db?sslmode=disable"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("❌ Failed to connect to PostgreSQL: %v", err)
	}

	// AutoMigrate for dev convenience
	if err := DB.AutoMigrate(
		&models.User{},
		&models.Intake{},
		&models.Brief{},
		&models.Feedback{},
	); err != nil {
		log.Fatalf("❌ AutoMigrate failed: %v", err)
	}

	// Seed demo user if not exists
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count == 0 {
		demo := models.User{
			Email:        "demo@briefly.ai",
			AgencyName:   "Demo Agency",
			PasswordHash: "$2a$10$dummyhashfordemopurposes",
		}
		DB.Create(&demo)
		log.Println("✅ Demo user seeded")
	}

	log.Println("✅ PostgreSQL connected")
}

// InitRedis opens a Redis connection.
func InitRedis() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379/0"
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("❌ Invalid REDIS_URL: %v", err)
	}

	Redis = redis.NewClient(opt)

	if err := Redis.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("❌ Failed to connect to Redis: %v", err)
	}

	log.Println("✅ Redis connected")
}
