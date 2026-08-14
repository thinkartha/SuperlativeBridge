package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/courses"
)

func main() {
	lambda.Start(courses.Handler)
}
