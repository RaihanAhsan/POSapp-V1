package model

import (
	"time"

	"github.com/google/uuid"
)

const (
	PaymentMethodCash = "cash"
	PaymentMethodCard = "card"
	PaymentMethodQRIS = "qris"
)

type Transaction struct {
	ID            uuid.UUID `json:"id"`
	InvoiceNumber string    `json:"invoice_number"`
	UserID        uuid.UUID `json:"user_id"`
	TotalAmount   int64     `json:"total_amount"`
	PaymentMethod string    `json:"payment_method"`
	CashReceived  *int64    `json:"cash_received,omitempty"`
	ChangeGiven   *int64    `json:"change_given,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type TransactionItem struct {
	ID            uuid.UUID `json:"id"`
	TransactionID uuid.UUID `json:"transaction_id"`
	ProductID     uuid.UUID `json:"product_id"`
	Quantity      int       `json:"quantity"`
	PriceAtSale   int64     `json:"price_at_sale"`
	Subtotal      int64     `json:"subtotal"`
}

type CheckoutItemRequest struct {
	ProductID uuid.UUID `json:"product_id"`
	Quantity  int       `json:"quantity"`
}

type CheckoutRequest struct {
	PaymentMethod string                `json:"payment_method"`
	CashReceived  *int64                `json:"cash_received,omitempty"`
	Items         []CheckoutItemRequest `json:"items"`
}

type TransactionItemResponse struct {
	ProductID   uuid.UUID `json:"product_id"`
	ProductName string    `json:"product_name"`
	SKU         string    `json:"sku"`
	Quantity    int       `json:"quantity"`
	PriceAtSale int64     `json:"price_at_sale"`
	Subtotal    int64     `json:"subtotal"`
}

type CashierSummary struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

type TransactionDetailResponse struct {
	ID            uuid.UUID                 `json:"id"`
	InvoiceNumber string                    `json:"invoice_number"`
	Cashier       CashierSummary            `json:"cashier"`
	TotalAmount   int64                     `json:"total_amount"`
	PaymentMethod string                    `json:"payment_method"`
	CashReceived  *int64                    `json:"cash_received,omitempty"`
	ChangeGiven   *int64                    `json:"change_given,omitempty"`
	CreatedAt     time.Time                 `json:"created_at"`
	Items         []TransactionItemResponse `json:"items"`
}

type TopProductSale struct {
	ProductID   uuid.UUID `json:"product_id"`
	ProductName string    `json:"product_name"`
	SKU         string    `json:"sku"`
	TotalSold   int       `json:"total_sold"`
	TotalVolume int64     `json:"total_revenue"`
}

type SalesReportResponse struct {
	GrossRevenue     int64            `json:"gross_revenue"`
	TransactionCount int              `json:"transaction_count"`
	AverageOrderVal  int64            `json:"average_order_value"`
	TopProducts      []TopProductSale `json:"top_products"`
}
