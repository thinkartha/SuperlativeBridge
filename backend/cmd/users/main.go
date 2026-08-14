package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/users"
)

func main() {
	lambda.Start(users.Handler)
}
