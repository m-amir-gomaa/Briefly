package db

import (
	"context"
	"log"
	"os"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var S3 *minio.Client

func initS3() {
	endpoint := os.Getenv("S3_ENDPOINT") // e.g. minio:9000
	accessKey := os.Getenv("S3_ACCESS_KEY")
	secretKey := os.Getenv("S3_SECRET_KEY")
	useSSL := os.Getenv("S3_USE_SSL") == "true"

	if endpoint == "" {
		log.Println("S3_ENDPOINT not set, skipping S3 initialization")
		return
	}

	var err error
	S3, err = minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Printf("Warning: Failed to initialize MinIO client for %s: %v. Continuing for distributed resilience.", endpoint, err)
		return
	}

	log.Printf("Successfully initialized S3 client for endpoint: %s", endpoint)

	// Ensure bucket exists
	bucketName := os.Getenv("S3_BUCKET")
	if bucketName == "" {
		bucketName = "briefly-intake"
	}

	exists, err := S3.BucketExists(context.Background(), bucketName)
	if err != nil {
		log.Printf("Warning: Could not check if bucket %s exists: %v", bucketName, err)
		return
	}

	if !exists {
		err = S3.MakeBucket(context.Background(), bucketName, minio.MakeBucketOptions{})
		if err != nil {
			log.Printf("Warning: Could not create bucket %s: %v", bucketName, err)
		} else {
			log.Printf("Created bucket: %s", bucketName)
		}
	}
}

func GetBucketName() string {
	bn := os.Getenv("S3_BUCKET")
	if bn == "" {
		return "briefly-intake"
	}
	return bn
}
