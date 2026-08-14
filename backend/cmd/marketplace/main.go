package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/marketplace"
)

func main() {
	lambda.Start(marketplace.Handler)
}
