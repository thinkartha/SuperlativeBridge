package response

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

func corsHeaders() map[string]string {
	return map[string]string{
		"Content-Type":                 "application/json",
		"Access-Control-Allow-Origin":  "*",
		"Access-Control-Allow-Headers": "Content-Type,Authorization",
		"Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
	}
}

func JSON(status int, body interface{}) events.APIGatewayProxyResponse {
	b, _ := json.Marshal(body)
	return events.APIGatewayProxyResponse{
		StatusCode: status,
		Headers:    corsHeaders(),
		Body:       string(b),
	}
}

func Error(status int, msg string) events.APIGatewayProxyResponse {
	return JSON(status, map[string]string{"error": msg})
}
