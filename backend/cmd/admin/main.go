package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/admin"
)

func main() {
	lambda.Start(admin.Handler)
}
