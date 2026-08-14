package settings

import (
	"context"
	"encoding/json"
	"time"

	"github.com/aws/aws-lambda-go/events"

	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/response"
)

type PlatformSettings struct {
	ID                      string    `json:"id"`
	PlatformName            string    `json:"platformName"`
	SupportEmail            string    `json:"supportEmail"`
	AllowPublicRegistration bool      `json:"allowPublicRegistration"`
	EmployerSelfService     bool      `json:"employerSelfService"`
	MentorApplications      bool      `json:"mentorApplications"`
	CourseReviews           bool      `json:"courseReviews"`
	NotifyNewUsers          bool      `json:"notifyNewUsers"`
	NotifyEnrollments       bool      `json:"notifyEnrollments"`
	NotifyBookings          bool      `json:"notifyBookings"`
	UpdatedAt               time.Time `json:"updatedAt"`
}

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	switch req.HTTPMethod {
	case "GET":
		return getSettings(ctx)
	case "PUT":
		return updateSettings(ctx, req)
	default:
		return response.Error(405, "method not allowed"), nil
	}
}

func scan(row interface {
	Scan(dest ...any) error
}) (PlatformSettings, error) {
	var s PlatformSettings
	err := row.Scan(&s.ID, &s.PlatformName, &s.SupportEmail, &s.AllowPublicRegistration,
		&s.EmployerSelfService, &s.MentorApplications, &s.CourseReviews,
		&s.NotifyNewUsers, &s.NotifyEnrollments, &s.NotifyBookings, &s.UpdatedAt)
	return s, err
}

func getSettings(ctx context.Context) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	s, err := scan(pool.QueryRow(ctx, `
		SELECT id, platform_name, support_email, allow_public_registration, employer_self_service,
			mentor_applications, course_reviews, notify_new_users, notify_enrollments, notify_bookings, updated_at
		FROM platform_settings WHERE id = 'default'`))
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, s), nil
}

func updateSettings(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var body PlatformSettings
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return response.Error(400, "invalid body"), nil
	}
	if body.PlatformName == "" {
		return response.Error(400, "platformName is required"), nil
	}
	if body.SupportEmail == "" {
		return response.Error(400, "supportEmail is required"), nil
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	s, err := scan(pool.QueryRow(ctx, `
		UPDATE platform_settings SET
			platform_name = $1, support_email = $2, allow_public_registration = $3,
			employer_self_service = $4, mentor_applications = $5, course_reviews = $6,
			notify_new_users = $7, notify_enrollments = $8, notify_bookings = $9, updated_at = now()
		WHERE id = 'default'
		RETURNING id, platform_name, support_email, allow_public_registration, employer_self_service,
			mentor_applications, course_reviews, notify_new_users, notify_enrollments, notify_bookings, updated_at`,
		body.PlatformName, body.SupportEmail, body.AllowPublicRegistration,
		body.EmployerSelfService, body.MentorApplications, body.CourseReviews,
		body.NotifyNewUsers, body.NotifyEnrollments, body.NotifyBookings))
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, s), nil
}
