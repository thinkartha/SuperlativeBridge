package main

import (
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/superlativebridge/backend/internal/handlers/mentorbookings"
)

func main() {
	lambda.Start(mentorbookings.Handler)
}
