package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/models"
	"github.com/stripe/stripe-go/v78"
	portalsession "github.com/stripe/stripe-go/v78/billingportal/session"
	checkoutsession "github.com/stripe/stripe-go/v78/checkout/session"
	"github.com/stripe/stripe-go/v78/webhook"
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

	// Link existing customer to prevent duplicates in Stripe
	if user.StripeCustomerID != "" {
		params.Customer = stripe.String(user.StripeCustomerID)
		params.CustomerEmail = nil
	}

	sess, err := checkoutsession.New(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create checkout session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": sess.URL})
}

// CreatePortalSession handles POST /api/v1/billing/create-portal
func CreatePortalSession(c *gin.Context) {
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

	if user.StripeCustomerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You do not have an active Stripe subscription profile to manage."})
		return
	}

	stripeKey := os.Getenv("STRIPE_SECRET_KEY")
	if stripeKey == "" {
		// Mock response for dev testing
		c.JSON(http.StatusOK, gin.H{
			"url": "/dashboard?mock_billing_portal=true",
			"message": "Stripe not configured. Billing portal mocked.",
		})
		return
	}

	stripe.Key = stripeKey
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(user.StripeCustomerID),
		ReturnURL: stripe.String(frontendURL + "/dashboard"),
	}

	sess, err := portalsession.New(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer portal session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": sess.URL})
}

// StripeWebhook handles POST /api/v1/billing/webhook
func StripeWebhook(c *gin.Context) {
	const MaxBodyBytes = int64(65536)
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxBodyBytes)
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	stripeKey := os.Getenv("STRIPE_SECRET_KEY")
	if stripeKey == "" {
		// In mock dev environment without keys, just return OK
		c.JSON(http.StatusOK, gin.H{"status": "Stripe keys not set, webhook ignored"})
		return
	}
	stripe.Key = stripeKey

	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	sigHeader := c.GetHeader("Stripe-Signature")

	var event stripe.Event

	// If STRIPE_WEBHOOK_SECRET is set, strictly verify the signature (for production safety)
	if webhookSecret != "" {
		event, err = webhook.ConstructEvent(payload, sigHeader, webhookSecret)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Webhook signature verification failed: %v", err)})
			return
		}
	} else {
		// Fallback for easy local development without local CLI secrets
		if err := json.Unmarshal(payload, &event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse webhook JSON"})
			return
		}
	}

	switch event.Type {
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		err := json.Unmarshal(event.Data.Raw, &session)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse checkout session data"})
			return
		}

		if session.ClientReferenceID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing client_reference_id"})
			return
		}

		userUUID, err := uuid.Parse(session.ClientReferenceID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid client_reference_id format"})
			return
		}

		var user models.User
		if err := db.DB.First(&user, "id = ?", userUUID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found for plan upgrade"})
			return
		}

		stripeCustID := session.Customer.ID
		updates := map[string]interface{}{
			"plan_tier":          "pro",
			"stripe_customer_id": stripeCustID,
		}

		if err := db.DB.Model(&user).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user plan to pro"})
			return
		}
		fmt.Printf("[StripeWebhook] Upgraded user %s to pro with customer %s\n", user.Email, stripeCustID)

	case "customer.subscription.deleted":
		var sub stripe.Subscription
		err := json.Unmarshal(event.Data.Raw, &sub)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse subscription data"})
			return
		}

		custID := sub.Customer.ID
		var user models.User
		if err := db.DB.First(&user, "stripe_customer_id = ?", custID).Error; err != nil {
			// Stripe customer might not map to a user yet
			c.JSON(http.StatusOK, gin.H{"status": "Customer user not found, ignoring"})
			return
		}

		if err := db.DB.Model(&user).Update("plan_tier", "free").Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to downgrade user plan"})
			return
		}
		fmt.Printf("[StripeWebhook] Downgraded user %s to free tier (subscription deleted)\n", user.Email)

	case "customer.subscription.updated":
		// Handle status updates like active -> unpaid or past_due
		var sub stripe.Subscription
		err := json.Unmarshal(event.Data.Raw, &sub)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse subscription data"})
			return
		}

		custID := sub.Customer.ID
		var user models.User
		if err := db.DB.First(&user, "stripe_customer_id = ?", custID).Error; err != nil {
			c.JSON(http.StatusOK, gin.H{"status": "Customer user not found, ignoring"})
			return
		}

		planTier := "pro"
		// If subscription is canceled, unpaid, or past due, we downgrade them to free
		if sub.Status == stripe.SubscriptionStatusUnpaid || sub.Status == stripe.SubscriptionStatusCanceled || sub.Status == stripe.SubscriptionStatusIncompleteExpired {
			planTier = "free"
		}

		if err := db.DB.Model(&user).Update("plan_tier", planTier).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user plan status"})
			return
		}
		fmt.Printf("[StripeWebhook] Updated user %s plan tier to %s (status: %s)\n", user.Email, planTier, sub.Status)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}
