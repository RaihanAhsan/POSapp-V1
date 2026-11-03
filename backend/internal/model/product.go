package model

import (
	"time"

	"github.com/google/uuid"
)

type Product struct {
	ID        uuid.UUID `json:"id"`
	SKU       string    `json:"sku"`
	Name      string    `json:"name"`
	Price     int64     `json:"price"` // In smallest currency unit (cents or Rupiah)
	Stock     int       `json:"stock"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateProductRequest struct {
	SKU   string `json:"sku"`
	Name  string `json:"name"`
	Price int64  `json:"price"`
	Stock int    `json:"stock"`
}

type UpdateProductRequest struct {
	SKU      *string `json:"sku,omitempty"`
	Name     *string `json:"name,omitempty"`
	Price    *int64  `json:"price,omitempty"`
	Stock    *int    `json:"stock,omitempty"`
	IsActive *bool   `json:"is_active,omitempty"`
}
