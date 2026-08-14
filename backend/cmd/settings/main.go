package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/settings"
)

func main() {
	lambda.Start(settings.Handler)
}
