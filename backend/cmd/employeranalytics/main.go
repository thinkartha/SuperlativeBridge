package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/employeranalytics"
)

func main() {
	lambda.Start(employeranalytics.Handler)
}
