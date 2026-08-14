package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/community"
)

func main() {
	lambda.Start(community.Handler)
}
