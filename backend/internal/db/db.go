package db

import (
	"context"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"strings"
	"time"
)

var (
	DB    *gorm.DB
	Redis redis.UniversalClient
	Ctx   = context.Background()
)

func Init() {
	initPostgres()
	initRedis()
	initS3()
}

func initPostgres() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to Database: %v", err)
	}

	sqlDB, err := DB.DB()
	if err == nil {
		// CockroachDB optimization: Higher idle connections for distributed latency
		sqlDB.SetMaxIdleConns(25)
		sqlDB.SetMaxOpenConns(100)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

	log.Println("Successfully connected to Database")
}

func initRedis() {
	redisUrl := os.Getenv("REDIS_URL")
	if redisUrl == "" {
		log.Fatal("REDIS_URL environment variable is not set")
	}

	// Support both single-node and cluster mode via env var
	if os.Getenv("REDIS_CLUSTER_MODE") == "true" {
		addrs := strings.Split(redisUrl, ",")
		Redis = redis.NewClusterClient(&redis.ClusterOptions{
			Addrs: addrs,
		})
	} else {
		opts, err := redis.ParseURL(redisUrl)
		if err != nil {
			log.Fatalf("Failed to parse REDIS_URL: %v", err)
		}
		Redis = redis.NewClient(opts)
	}

	if err := Redis.Ping(Ctx).Err(); err != nil {
		log.Printf("Warning: Redis not ready yet: %v", err)
	}

	log.Println("Successfully connected to Redis")
}
