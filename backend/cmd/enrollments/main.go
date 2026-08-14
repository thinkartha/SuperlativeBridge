package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/enrollments"
)

func main() {
	lambda.Start(enrollments.Handler)
}
