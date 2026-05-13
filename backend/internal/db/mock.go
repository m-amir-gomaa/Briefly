package db

import (
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/alicebob/miniredis/v2"
	"github.com/minio/minio-go/v7"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func SetupMockDB() (sqlmock.Sqlmock, error) {
	sqlDB, mock, err := sqlmock.New()
	if err != nil {
		return nil, err
	}

	dialector := postgres.New(postgres.Config{
		Conn:       sqlDB,
		DriverName: "postgres",
	})
	DB, err = gorm.Open(dialector, &gorm.Config{})
	return mock, err
}

func SetupMockRedis() (*miniredis.Miniredis, error) {
	mr, err := miniredis.Run()
	if err != nil {
		return nil, err
	}

	Redis = redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})
	return mr, nil
}

func SetupMockS3() {
	S3, _ = minio.New("localhost:1", &minio.Options{})
}
