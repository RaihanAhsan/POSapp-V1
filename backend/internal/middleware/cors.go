package middleware

import (
	"net/http"
	"regexp"
	"strings"

	"github.com/go-chi/cors"
)

var localhostRegex = regexp.MustCompile(`^https?://(localhost|127\.0\.0\.1)(:\d+)?$`)

func NewCORSMiddleware(allowedOrigins string) func(http.Handler) http.Handler {
	var explicitOrigins []string
	allowAll := false

	if allowedOrigins == "*" || strings.TrimSpace(allowedOrigins) == "" {
		allowAll = true
	} else {
		for _, o := range strings.Split(allowedOrigins, ",") {
			cleaned := strings.TrimSpace(o)
			if cleaned != "" {
				if cleaned == "*" {
					allowAll = true
				}
				explicitOrigins = append(explicitOrigins, cleaned)
			}
		}
	}

	return cors.Handler(cors.Options{
		AllowOriginFunc: func(r *http.Request, origin string) bool {
			if allowAll {
				return true
			}
			// Allow any port on localhost or 127.0.0.1 for local development
			if localhostRegex.MatchString(origin) {
				return true
			}
			// Check against explicit origins (e.g. Production Vercel domains)
			for _, o := range explicitOrigins {
				if strings.EqualFold(o, origin) {
					return true
				}
			}
			return false
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})
}

