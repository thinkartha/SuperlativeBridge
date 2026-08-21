package response

import (
	"encoding/json"
	"testing"
)

func TestJSON(t *testing.T) {
	res := JSON(200, map[string]string{"status": "ok"})
	if res.StatusCode != 200 {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	if res.Headers["Content-Type"] != "application/json" {
		t.Fatalf("content-type = %q", res.Headers["Content-Type"])
	}

	var body map[string]string
	if err := json.Unmarshal([]byte(res.Body), &body); err != nil {
		t.Fatalf("unmarshal body: %v", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("body = %v", body)
	}
}

func TestError(t *testing.T) {
	res := Error(401, "unauthorized")
	if res.StatusCode != 401 {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}

	var body map[string]string
	if err := json.Unmarshal([]byte(res.Body), &body); err != nil {
		t.Fatalf("unmarshal body: %v", err)
	}
	if body["error"] != "unauthorized" {
		t.Fatalf("body = %v", body)
	}
}
