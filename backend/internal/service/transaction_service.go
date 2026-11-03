package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/google/uuid"
	"kasirku-backend/internal/model"
	"kasirku-backend/internal/repository"
)

type TransactionService interface {
	Checkout(ctx context.Context, userID uuid.UUID, req model.CheckoutRequest) (*model.TransactionDetailResponse, error)
	GetTransaction(ctx context.Context, id uuid.UUID, currentUserID uuid.UUID, role string) (*model.TransactionDetailResponse, error)
	ListTransactions(ctx context.Context, currentUserID uuid.UUID, role string, filterUserID *uuid.UUID, startDate, endDate *time.Time) ([]model.TransactionDetailResponse, error)
	GetSalesReport(ctx context.Context, startDate, endDate *time.Time) (*model.SalesReportResponse, error)
}

type transactionService struct {
	txRepo repository.TransactionRepository
}

func NewTransactionService(txRepo repository.TransactionRepository) TransactionService {
	return &transactionService{txRepo: txRepo}
}

func (s *transactionService) Checkout(ctx context.Context, userID uuid.UUID, req model.CheckoutRequest) (*model.TransactionDetailResponse, error) {
	if len(req.Items) == 0 {
		return nil, errors.New("cart cannot be empty")
	}

	for _, item := range req.Items {
		if item.ProductID == uuid.Nil {
			return nil, errors.New("product_id is required")
		}
		if item.Quantity <= 0 {
			return nil, errors.New("item quantity must be greater than zero")
		}
	}

	req.PaymentMethod = strings.ToLower(strings.TrimSpace(req.PaymentMethod))
	if req.PaymentMethod != model.PaymentMethodCash &&
		req.PaymentMethod != model.PaymentMethodCard &&
		req.PaymentMethod != model.PaymentMethodQRIS {
		return nil, fmt.Errorf("invalid payment method '%s'. Allowed: cash, card, qris", req.PaymentMethod)
	}

	invoiceNumber := s.generateInvoiceNumber()

	return s.txRepo.ProcessCheckout(ctx, userID, invoiceNumber, req.PaymentMethod, req.CashReceived, req.Items)
}

func (s *transactionService) generateInvoiceNumber() string {
	dateStr := time.Now().Format("20060102")
	// Generate random 5-digit number
	n, _ := rand.Int(rand.Reader, big.NewInt(90000))
	randNum := n.Int64() + 10000
	return fmt.Sprintf("INV-%s-%d", dateStr, randNum)
}

func (s *transactionService) GetTransaction(ctx context.Context, id uuid.UUID, currentUserID uuid.UUID, role string) (*model.TransactionDetailResponse, error) {
	tx, err := s.txRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// If Staff, ensure transaction belongs to current user
	if role == model.RoleStaff && tx.Cashier.ID != currentUserID {
		return nil, errors.New("forbidden: cannot view other cashiers' transactions")
	}

	return tx, nil
}

func (s *transactionService) ListTransactions(
	ctx context.Context,
	currentUserID uuid.UUID,
	role string,
	filterUserID *uuid.UUID,
	startDate, endDate *time.Time,
) ([]model.TransactionDetailResponse, error) {
	// If Staff, MUST scope to own user ID and default to today if not specified
	if role == model.RoleStaff {
		filterUserID = &currentUserID
		if startDate == nil {
			today := time.Now().Truncate(24 * time.Hour)
			startDate = &today
		}
	}

	return s.txRepo.List(ctx, filterUserID, startDate, endDate)
}

func (s *transactionService) GetSalesReport(ctx context.Context, startDate, endDate *time.Time) (*model.SalesReportResponse, error) {
	return s.txRepo.GetSalesReport(ctx, startDate, endDate)
}
