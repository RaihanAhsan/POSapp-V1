package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"kasirku-backend/internal/middleware"
	"kasirku-backend/internal/model"
	"kasirku-backend/internal/repository"
	"kasirku-backend/internal/service"
)

type TransactionHandler struct {
	txService service.TransactionService
}

func NewTransactionHandler(txService service.TransactionService) *TransactionHandler {
	return &TransactionHandler{txService: txService}
}

func (h *TransactionHandler) Checkout(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetClaims(r.Context())
	if !ok || claims == nil {
		RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User identity not found in token")
		return
	}

	var req model.CheckoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse checkout request body")
		return
	}

	res, err := h.txService.Checkout(r.Context(), claims.UserID, req)
	if err != nil {
		if errors.Is(err, repository.ErrInsufficientStock) || strings.Contains(err.Error(), "insufficient stock") {
			RespondError(w, http.StatusConflict, "INSUFFICIENT_STOCK", err.Error())
			return
		}
		if strings.Contains(err.Error(), "insufficient tender") {
			RespondError(w, http.StatusBadRequest, "INSUFFICIENT_TENDER", err.Error())
			return
		}
		if errors.Is(err, repository.ErrInactiveProduct) || strings.Contains(err.Error(), "inactive") {
			RespondError(w, http.StatusBadRequest, "INACTIVE_PRODUCT", err.Error())
			return
		}
		RespondError(w, http.StatusBadRequest, "CHECKOUT_FAILED", err.Error())
		return
	}

	RespondSuccess(w, http.StatusCreated, res)
}

func (h *TransactionHandler) ListTransactions(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetClaims(r.Context())
	if !ok || claims == nil {
		RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User identity not found in token")
		return
	}

	var filterUserID *uuid.UUID
	if userParam := r.URL.Query().Get("user_id"); userParam != "" && claims.Role == model.RoleAdmin {
		if uID, err := uuid.Parse(userParam); err == nil {
			filterUserID = &uID
		}
	}

	var startDate, endDate *time.Time
	if startParam := r.URL.Query().Get("start_date"); startParam != "" {
		if t, err := time.Parse("2006-01-02", startParam); err == nil {
			startDate = &t
		}
	}
	if endParam := r.URL.Query().Get("end_date"); endParam != "" {
		if t, err := time.Parse("2006-01-02", endParam); err == nil {
			// Include the whole end day
			tEnd := t.Add(24 * time.Hour)
			endDate = &tEnd
		}
	}

	transactions, err := h.txService.ListTransactions(r.Context(), claims.UserID, claims.Role, filterUserID, startDate, endDate)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list transactions")
		return
	}

	RespondSuccess(w, http.StatusOK, transactions)
}

func (h *TransactionHandler) GetTransaction(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetClaims(r.Context())
	if !ok || claims == nil {
		RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User identity not found in token")
		return
	}

	idParam := chi.URLParam(r, "id")
	txID, err := uuid.Parse(idParam)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "INVALID_ID", "Invalid transaction ID format")
		return
	}

	tx, err := h.txService.GetTransaction(r.Context(), txID, claims.UserID, claims.Role)
	if err != nil {
		if errors.Is(err, repository.ErrTransactionNotFound) {
			RespondError(w, http.StatusNotFound, "NOT_FOUND", "Transaction not found")
			return
		}
		if strings.Contains(err.Error(), "forbidden") {
			RespondError(w, http.StatusForbidden, "FORBIDDEN", err.Error())
			return
		}
		RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get transaction")
		return
	}

	RespondSuccess(w, http.StatusOK, tx)
}
