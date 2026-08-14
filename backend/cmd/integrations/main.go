package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/integrations"
)

func main() {
	lambda.Start(integrations.Handler)
}
