package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/savedcourses"
)

func main() {
	lambda.Start(savedcourses.Handler)
}
