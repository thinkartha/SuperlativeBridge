package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/auth"
)

func main() {
	lambda.Start(auth.Handler)
}
