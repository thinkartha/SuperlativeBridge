// Command localserver serves the same handlers that run on AWS Lambda over a
// plain HTTP server, so the whole stack can run locally with Docker Compose.
package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"

	"github.com/superlativebridge/backend/internal/handlers/admin"
	"github.com/superlativebridge/backend/internal/handlers/auth"
	"github.com/superlativebridge/backend/internal/handlers/candidates"
	"github.com/superlativebridge/backend/internal/handlers/categories"
	"github.com/superlativebridge/backend/internal/handlers/community"
	"github.com/superlativebridge/backend/internal/handlers/courses"
	"github.com/superlativebridge/backend/internal/handlers/employeranalytics"
	"github.com/superlativebridge/backend/internal/handlers/enrollments"
	"github.com/superlativebridge/backend/internal/handlers/entrepreneurship"
	"github.com/superlativebridge/backend/internal/handlers/health"
	"github.com/superlativebridge/backend/internal/handlers/integrations"
	"github.com/superlativebridge/backend/internal/handlers/lms"
	"github.com/superlativebridge/backend/internal/handlers/marketplace"
	"github.com/superlativebridge/backend/internal/handlers/mentorbookings"
	"github.com/superlativebridge/backend/internal/handlers/mentors"
	"github.com/superlativebridge/backend/internal/handlers/programs"
	"github.com/superlativebridge/backend/internal/handlers/savedcourses"
	"github.com/superlativebridge/backend/internal/handlers/settings"
	"github.com/superlativebridge/backend/internal/handlers/users"
	"github.com/superlativebridge/backend/internal/handlers/visa"
)

type lambdaHandler func(context.Context, events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error)

type route struct {
	method   string
	resource string // API Gateway style, e.g. /api/courses/{id}
	handler  lambdaHandler
}

var routes = []route{
	{"GET", "/api/health", health.Handler},

	{"GET", "/api/courses", courses.Handler},
	{"POST", "/api/courses", courses.Handler},
	{"GET", "/api/courses/{id}", courses.Handler},
	{"PUT", "/api/courses/{id}", courses.Handler},
	{"DELETE", "/api/courses/{id}", courses.Handler},

	{"GET", "/api/categories", categories.Handler},
	{"POST", "/api/categories", categories.Handler},
	{"PUT", "/api/categories/{id}", categories.Handler},
	{"DELETE", "/api/categories/{id}", categories.Handler},

	{"GET", "/api/mentors", mentors.Handler},
	{"POST", "/api/mentors", mentors.Handler},
	{"GET", "/api/mentors/{id}", mentors.Handler},
	{"GET", "/api/mentors/{id}/analytics", mentors.Handler},
	{"PUT", "/api/mentors/{id}", mentors.Handler},
	{"DELETE", "/api/mentors/{id}", mentors.Handler},

	{"GET", "/api/users", users.Handler},
	{"POST", "/api/users", users.Handler},
	{"GET", "/api/users/{id}", users.Handler},
	{"PUT", "/api/users/{id}", users.Handler},
	{"DELETE", "/api/users/{id}", users.Handler},
	{"GET", "/api/users/{id}/enrollments", users.Handler},
	{"GET", "/api/users/{id}/certifications", users.Handler},
	{"GET", "/api/users/{id}/notifications", users.Handler},
	{"GET", "/api/users/{id}/dashboard", users.Handler},
	{"GET", "/api/users/{id}/saved-courses", users.Handler},
	{"GET", "/api/users/{id}/mentor-bookings", users.Handler},
	{"GET", "/api/users/{id}/analytics", users.Handler},

	{"POST", "/api/enrollments", enrollments.Handler},
	{"PATCH", "/api/enrollments/{id}", enrollments.Handler},
	{"DELETE", "/api/enrollments/{id}", enrollments.Handler},
	{"POST", "/api/quiz-attempts", enrollments.Handler},

	{"GET", "/api/integrations", integrations.Handler},
	{"GET", "/api/integrations/{id}", integrations.Handler},
	{"PUT", "/api/integrations/{id}", integrations.Handler},
	{"PUT", "/api/integrations/pipelines/{id}", integrations.Handler},
	{"POST", "/api/integrations/pipelines/{id}/run", integrations.Handler},

	{"GET", "/api/lms/providers", lms.Handler},
	{"POST", "/api/lms/courses/import", lms.Handler},
	{"POST", "/api/lms/providers/{provider}/sync", lms.Handler},
	{"POST", "/api/lms/webhooks/{provider}", lms.Handler},
	{"GET", "/api/lms/jobs", lms.Handler},

	{"POST", "/api/saved-courses", savedcourses.Handler},
	{"DELETE", "/api/saved-courses/{courseId}", savedcourses.Handler},

	{"POST", "/api/mentor-bookings", mentorbookings.Handler},
	{"PATCH", "/api/mentor-bookings/{id}", mentorbookings.Handler},
	{"GET", "/api/mentors/{id}/availability", mentorbookings.Handler},
	{"GET", "/api/mentors/{id}/bookings", mentorbookings.Handler},

	{"GET", "/api/employer/analytics", employeranalytics.Handler},
	{"GET", "/api/employer/analytics/export", employeranalytics.Handler},

	{"POST", "/api/auth/signin", auth.Handler},
	{"POST", "/api/auth/signup", auth.Handler},
	{"GET", "/api/auth/cognito-config", auth.Handler},

	{"GET", "/api/programs", programs.Handler},
	{"GET", "/api/programs/{id}", programs.Handler},
	{"GET", "/api/visa-programs", visa.Handler},
	{"GET", "/api/marketplace", marketplace.Handler},
	{"GET", "/api/community", community.Handler},
	{"POST", "/api/community/events/{id}/rsvp", community.Handler},
	{"GET", "/api/entrepreneurship", entrepreneurship.Handler},
	{"GET", "/api/candidates", candidates.Handler},
	{"GET", "/api/candidates/{id}", candidates.Handler},
	{"GET", "/api/admin/stats", admin.Handler},
	{"GET", "/api/admin/audit-log", admin.Handler},
	{"GET", "/api/admin/user-analytics", admin.Handler},
	{"GET", "/api/admin/mentor-analytics", admin.Handler},
	{"GET", "/api/admin/notifications", admin.Handler},
	{"PATCH", "/api/admin/notifications/{id}", admin.Handler},
	{"GET", "/api/settings", settings.Handler},
	{"PUT", "/api/settings", settings.Handler},
}

func pathParamNames(resource string) []string {
	names := []string{}
	for _, seg := range strings.Split(resource, "/") {
		if strings.HasPrefix(seg, "{") && strings.HasSuffix(seg, "}") {
			names = append(names, strings.Trim(seg, "{}"))
		}
	}
	return names
}

func adapt(r route) http.HandlerFunc {
	params := pathParamNames(r.resource)
	return func(w http.ResponseWriter, req *http.Request) {
		body, _ := io.ReadAll(req.Body)

		query := map[string]string{}
		for k, v := range req.URL.Query() {
			if len(v) > 0 {
				query[k] = v[0]
			}
		}
		headers := map[string]string{}
		for k, v := range req.Header {
			if len(v) > 0 {
				headers[k] = v[0]
				headers[strings.ToLower(k)] = v[0]
			}
		}
		if authz := req.Header.Get("Authorization"); authz != "" {
			headers["Authorization"] = authz
			headers["authorization"] = authz
		}
		pathParams := map[string]string{}
		for _, name := range params {
			pathParams[name] = req.PathValue(name)
		}

		evt := events.APIGatewayProxyRequest{
			HTTPMethod:            req.Method,
			Path:                  req.URL.Path,
			Resource:              r.resource,
			Headers:               headers,
			QueryStringParameters: query,
			PathParameters:        pathParams,
			Body:                  string(body),
		}

		start := time.Now()
		res, err := r.handler(req.Context(), evt)
		if err != nil {
			log.Printf("%s %s -> handler error: %v", req.Method, req.URL.Path, err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		for k, v := range res.Headers {
			w.Header().Set(k, v)
		}
		w.Header().Set("Access-Control-Allow-Origin", "*")
		status := res.StatusCode
		if status == 0 {
			status = http.StatusOK
		}
		w.WriteHeader(status)
		if res.Body != "" {
			io.WriteString(w, res.Body)
		}
		log.Printf("%s %s -> %d (%s)", req.Method, req.URL.Path, status, time.Since(start).Truncate(time.Millisecond))
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()
	for _, r := range routes {
		mux.HandleFunc(r.method+" "+r.resource, adapt(r))
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	log.Printf("SuperlativeBridge local API listening on :%s (%d routes)", port, len(routes))
	if err := http.ListenAndServe(":"+port, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}
