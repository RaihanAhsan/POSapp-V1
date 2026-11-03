package handler

import (
	"net/http"
	"time"

	"kasirku-backend/internal/service"
)

type ReportHandler struct {
	txService service.TransactionService
}

func NewReportHandler(txService service.TransactionService) *ReportHandler {
	return &ReportHandler{txService: txService}
}

func (h *ReportHandler) GetSalesReport(w http.ResponseWriter, r *http.Request) {
	var startDate, endDate *time.Time
	if startParam := r.URL.Query().Get("start_date"); startParam != "" {
		if t, err := time.Parse("2006-01-02", startParam); err == nil {
			startDate = &t
		}
	}
	if endParam := r.URL.Query().Get("end_date"); endParam != "" {
		if t, err := time.Parse("2006-01-02", endParam); err == nil {
			tEnd := t.Add(24 * time.Hour)
			endDate = &tEnd
		}
	}

	report, err := h.txService.GetSalesReport(r.Context(), startDate, endDate)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to generate sales report")
		return
	}

	RespondSuccess(w, http.StatusOK, report)
}
