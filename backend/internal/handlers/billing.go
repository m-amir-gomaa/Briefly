package handlers

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/models"
	"github.com/stripe/stripe-go/v78"
	"github.com/stripe/stripe-go/v78/checkout/session"
)

// CreateCheckoutSession handles POST /api/v1/billing/create-checkout
func CreateCheckoutSession(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	var user models.User
	if err := db.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find user"})
		return
	}

	stripeKey := os.Getenv("STRIPE_SECRET_KEY")
	if stripeKey == "" {
		// Mock response for testing if Stripe is not configured
		c.JSON(http.StatusOK, gin.H{
			"url": "/dashboard?mock_upgrade=true",
			"message": "Stripe not configured. Upgrade mocked for testing.",
		})
		return
	}

	stripe.Key = stripeKey
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173" // Default for local dev
	}

	// Example Pro Plan Price ID
	// You should configure this via env var or DB later
	priceID := os.Getenv("STRIPE_PRO_PRICE_ID")
	if priceID == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Stripe pricing not configured"})
		return
	}

	params := &stripe.CheckoutSessionParams{
		CustomerEmail: stripe.String(user.Email),
		SuccessURL:    stripe.String(frontendURL + "/dashboard?checkout=success"),
		CancelURL:     stripe.String(frontendURL + "/pricing?checkout=canceled"),
		Mode:          stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		ClientReferenceID: stripe.String(user.ID.String()),
	}

	sess, err := session.New(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create checkout session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": sess.URL})
}

// StripeWebhook handles POST /api/v1/billing/webhook
func StripeWebhook(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "Webhook stubbed"})
}
