package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"kasirku-backend/internal/service"
)

type contextKey string

const (
	ClaimsContextKey contextKey = "user_claims"
)

func AuthMiddleware(authService service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				respondJSONError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authorization header is missing")
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				respondJSONError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid authorization header format")
				return
			}

			claims, err := authService.ValidateToken(parts[1])
			if err != nil {
				respondJSONError(w, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid or expired token")
				return
			}

			ctx := context.WithValue(r.Context(), ClaimsContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(ClaimsContextKey).(*service.CustomClaims)
			if !ok || claims == nil {
				respondJSONError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User identity not found in request context")
				return
			}

			isAllowed := false
			for _, role := range allowedRoles {
				if strings.EqualFold(claims.Role, role) {
					isAllowed = true
					break
				}
			}

			if !isAllowed {
				respondJSONError(w, http.StatusForbidden, "FORBIDDEN", "You do not have permission to access this resource")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func GetClaims(ctx context.Context) (*service.CustomClaims, bool) {
	claims, ok := ctx.Value(ClaimsContextKey).(*service.CustomClaims)
	return claims, ok
}

func GetUserID(ctx context.Context) (uuid.UUID, bool) {
	claims, ok := GetClaims(ctx)
	if !ok || claims == nil {
		return uuid.Nil, false
	}
	return claims.UserID, true
}

func respondJSONError(w http.ResponseWriter, statusCode int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "error",
		"code":    code,
		"message": message,
	})
}
