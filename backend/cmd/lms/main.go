package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/lms"
)

func main() {
	lambda.Start(lms.Handler)
}
