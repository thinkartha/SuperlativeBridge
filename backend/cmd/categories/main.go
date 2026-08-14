package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/categories"
)

func main() {
	lambda.Start(categories.Handler)
}
