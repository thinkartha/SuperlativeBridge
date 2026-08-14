package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/visa"
)

func main() {
	lambda.Start(visa.Handler)
}
