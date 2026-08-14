package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/entrepreneurship"
)

func main() {
	lambda.Start(entrepreneurship.Handler)
}
