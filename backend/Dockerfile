FROM golang:alpine AS builder

WORKDIR /app

# Copy go mod file (go.sum deleted to resolve conflicts)
COPY go.mod ./
# Copy source code
COPY . .

# Tidy up dependencies (resolves missing go.sum entries)
RUN go mod tidy

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api/main.go

# Start a new stage from scratch
FROM alpine:latest  

WORKDIR /root/

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
