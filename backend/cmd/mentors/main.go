package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/mentors"
)

func main() {
	lambda.Start(mentors.Handler)
}
