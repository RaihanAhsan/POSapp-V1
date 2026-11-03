package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"kasirku-backend/internal/model"
)

var (
	ErrProductNotFound = errors.New("product not found")
	ErrSKUAlreadyExists = errors.New("a product with this SKU already exists")
)

type ProductRepository interface {
	List(ctx context.Context, search string, onlyActive bool) ([]model.Product, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.Product, error)
	GetBySKU(ctx context.Context, sku string) (*model.Product, error)
	Create(ctx context.Context, product *model.Product) error
	Update(ctx context.Context, product *model.Product) error
	SoftDelete(ctx context.Context, id uuid.UUID) error
}

type productRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) List(ctx context.Context, search string, onlyActive bool) ([]model.Product, error) {
	query := `
		SELECT id, sku, name, price, stock, is_active, created_at, updated_at
		FROM products
		WHERE 1=1
	`
	var args []interface{}
	argIdx := 1

	if onlyActive {
		query += fmt.Sprintf(" AND is_active = $%d", argIdx)
		args = append(args, true)
		argIdx++
	}

	if search != "" {
		searchTerm := "%" + strings.ToLower(search) + "%"
		query += fmt.Sprintf(" AND (LOWER(name) LIKE $%d OR LOWER(sku) LIKE $%d)", argIdx, argIdx)
		args = append(args, searchTerm)
		argIdx++
	}

	query += " ORDER BY name ASC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query products: %w", err)
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var p model.Product
		if err := rows.Scan(&p.ID, &p.SKU, &p.Name, &p.Price, &p.Stock, &p.IsActive, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan product: %w", err)
		}
		products = append(products, p)
	}

	return products, nil
}

func (r *productRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Product, error) {
	query := `
		SELECT id, sku, name, price, stock, is_active, created_at, updated_at
		FROM products
		WHERE id = $1
	`
	var p model.Product
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&p.ID, &p.SKU, &p.Name, &p.Price, &p.Stock, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrProductNotFound
		}
		return nil, fmt.Errorf("failed to get product by ID: %w", err)
	}

	return &p, nil
}

func (r *productRepository) GetBySKU(ctx context.Context, sku string) (*model.Product, error) {
	query := `
		SELECT id, sku, name, price, stock, is_active, created_at, updated_at
		FROM products
		WHERE sku = $1
	`
	var p model.Product
	err := r.db.QueryRowContext(ctx, query, sku).Scan(
		&p.ID, &p.SKU, &p.Name, &p.Price, &p.Stock, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrProductNotFound
		}
		return nil, fmt.Errorf("failed to get product by SKU: %w", err)
	}

	return &p, nil
}

func (r *productRepository) Create(ctx context.Context, product *model.Product) error {
	query := `
		INSERT INTO products (sku, name, price, stock, is_active)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRowContext(
		ctx,
		query,
		product.SKU,
		product.Name,
		product.Price,
		product.Stock,
		product.IsActive,
	).Scan(&product.ID, &product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		if strings.Contains(err.Error(), "idx_products_sku") || strings.Contains(err.Error(), "unique") {
			return ErrSKUAlreadyExists
		}
		return fmt.Errorf("failed to insert product: %w", err)
	}

	return nil
}

func (r *productRepository) Update(ctx context.Context, product *model.Product) error {
	query := `
		UPDATE products
		SET sku = $1, name = $2, price = $3, stock = $4, is_active = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING updated_at
	`
	err := r.db.QueryRowContext(
		ctx,
		query,
		product.SKU,
		product.Name,
		product.Price,
		product.Stock,
		product.IsActive,
		product.ID,
	).Scan(&product.UpdatedAt)

	if err != nil {
		if strings.Contains(err.Error(), "idx_products_sku") || strings.Contains(err.Error(), "unique") {
			return ErrSKUAlreadyExists
		}
		return fmt.Errorf("failed to update product: %w", err)
	}

	return nil
}

func (r *productRepository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE products
		SET is_active = FALSE, updated_at = NOW()
		WHERE id = $1
	`
	res, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to soft delete product: %w", err)
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrProductNotFound
	}

	return nil
}
