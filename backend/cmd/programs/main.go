package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/programs"
)

func main() {
	lambda.Start(programs.Handler)
}
