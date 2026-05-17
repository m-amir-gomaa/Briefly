package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"os"
)

var encryptionKey []byte

func init() {
	key := os.Getenv("ENCRYPTION_KEY")
	if key == "" {
		log.Fatal("FATAL: ENCRYPTION_KEY environment variable is not configured. HALTING to prevent unsafe silent encryption fallback.")
	}
	// AES-256 requires exactly 32 bytes
	if len(key) != 32 {
		log.Fatalf("FATAL: ENCRYPTION_KEY must be exactly 32 bytes for AES-256 (currently got %d bytes).", len(key))
	}
	encryptionKey = []byte(key)
}

func Encrypt(text string) (string, error) {
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	plaintext := []byte(text)
	// Seal prepends the nonce to the ciphertext to make storage easy
	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)

	return base64.URLEncoding.EncodeToString(ciphertext), nil
}

func Decrypt(cryptoText string) (string, error) {
	ciphertext, err := base64.URLEncoding.DecodeString(cryptoText)
	if err != nil {
		return "", fmt.Errorf("invalid base64 encoding: %v", err)
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", fmt.Errorf("ciphertext too short (minimum %d bytes)", nonceSize)
	}

	nonce := ciphertext[:nonceSize]
	actualCiphertext := ciphertext[nonceSize:]

	plaintext, err := gcm.Open(nil, nonce, actualCiphertext, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt or authenticate payload: %v", err)
	}

	return string(plaintext), nil
}
