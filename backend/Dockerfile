# Local API server: runs the same Lambda handlers behind a plain HTTP server.
FROM golang:1.24-alpine AS build
WORKDIR /src
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/localserver ./cmd/localserver
RUN printf 'package main\nimport ("net/http";"os")\nfunc main(){r,err:=http.Get(os.Args[1]);if err!=nil||r.StatusCode>=500{os.Exit(1)}}\n' > /tmp/hc.go \
    && CGO_ENABLED=0 go build -o /out/healthcheck /tmp/hc.go

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /out/localserver /app/localserver
COPY --from=build /out/healthcheck /app/healthcheck
EXPOSE 8081
CMD ["/app/localserver"]
