package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/health"
)

func main() {
	lambda.Start(health.Handler)
}
