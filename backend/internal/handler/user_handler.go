package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"kasirku-backend/internal/model"
	"kasirku-backend/internal/service"
)

type UserHandler struct {
	authService service.AuthService
}

func NewUserHandler(authService service.AuthService) *UserHandler {
	return &UserHandler{authService: authService}
}

func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.authService.ListUsers(r.Context())
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve users")
		return
	}

	RespondSuccess(w, http.StatusOK, users)
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req model.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.Name == "" || req.Role == "" {
		RespondError(w, http.StatusBadRequest, "VALIDATION_FAILED", "Name, email, password, and role are required")
		return
	}

	user, err := h.authService.CreateUser(r.Context(), req)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "CREATE_FAILED", err.Error())
		return
	}

	RespondSuccess(w, http.StatusCreated, user)
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	userID, err := uuid.Parse(idParam)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
		return
	}

	var req model.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse request body")
		return
	}

	user, err := h.authService.UpdateUser(r.Context(), userID, req)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "UPDATE_FAILED", err.Error())
		return
	}

	RespondSuccess(w, http.StatusOK, user)
}
