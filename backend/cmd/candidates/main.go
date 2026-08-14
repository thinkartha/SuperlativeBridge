package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/candidates"
)

func main() {
	lambda.Start(candidates.Handler)
}
