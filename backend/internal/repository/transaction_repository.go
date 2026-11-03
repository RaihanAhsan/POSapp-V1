package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"kasirku-backend/internal/model"
)

var (
	ErrTransactionNotFound = errors.New("transaction not found")
	ErrInsufficientStock   = errors.New("insufficient stock")
	ErrInactiveProduct     = errors.New("cannot purchase inactive product")
)

type TransactionRepository interface {
	ProcessCheckout(
		ctx context.Context,
		userID uuid.UUID,
		invoiceNumber string,
		paymentMethod string,
		cashReceived *int64,
		items []model.CheckoutItemRequest,
	) (*model.TransactionDetailResponse, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.TransactionDetailResponse, error)
	List(ctx context.Context, filterUserID *uuid.UUID, startDate, endDate *time.Time) ([]model.TransactionDetailResponse, error)
	GetSalesReport(ctx context.Context, startDate, endDate *time.Time) (*model.SalesReportResponse, error)
}

type transactionRepository struct {
	db *sql.DB
}

func NewTransactionRepository(db *sql.DB) TransactionRepository {
	return &transactionRepository{db: db}
}

func (r *transactionRepository) ProcessCheckout(
	ctx context.Context,
	userID uuid.UUID,
	invoiceNumber string,
	paymentMethod string,
	cashReceived *int64,
	items []model.CheckoutItemRequest,
) (*model.TransactionDetailResponse, error) {
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Fetch Cashier details
	var cashierName string
	err = tx.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", userID).Scan(&cashierName)
	if err != nil {
		return nil, fmt.Errorf("failed to find cashier: %w", err)
	}

	var totalAmount int64
	var responseItems []model.TransactionItemResponse

	// 2. Lock each product row with SELECT ... FOR UPDATE, validate stock, and calculate totals
	type itemProcessing struct {
		productID   uuid.UUID
		productName string
		sku         string
		price       int64
		quantity    int
		subtotal    int64
	}
	var processedItems []itemProcessing

	for _, item := range items {
		var pName, pSKU string
		var pPrice int64
		var pStock int
		var pIsActive bool

		queryLock := `
			SELECT name, sku, price, stock, is_active
			FROM products
			WHERE id = $1
			FOR UPDATE
		`
		err := tx.QueryRowContext(ctx, queryLock, item.ProductID).Scan(&pName, &pSKU, &pPrice, &pStock, &pIsActive)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return nil, fmt.Errorf("product %s not found", item.ProductID)
			}
			return nil, fmt.Errorf("failed to lock product: %w", err)
		}

		if !pIsActive {
			return nil, fmt.Errorf("%w: product '%s'", ErrInactiveProduct, pName)
		}

		if pStock < item.Quantity {
			return nil, fmt.Errorf("%w for product '%s'. Available: %d, Requested: %d", ErrInsufficientStock, pName, pStock, item.Quantity)
		}

		subtotal := pPrice * int64(item.Quantity)
		totalAmount += subtotal

		// Deduct stock
		updateStockQuery := `
			UPDATE products
			SET stock = stock - $1, updated_at = NOW()
			WHERE id = $2
		`
		if _, err := tx.ExecContext(ctx, updateStockQuery, item.Quantity, item.ProductID); err != nil {
			return nil, fmt.Errorf("failed to deduct stock: %w", err)
		}

		processedItems = append(processedItems, itemProcessing{
			productID:   item.ProductID,
			productName: pName,
			sku:         pSKU,
			price:       pPrice,
			quantity:    item.Quantity,
			subtotal:    subtotal,
		})
	}

	// 3. Payment Validation
	var changeGiven *int64
	if paymentMethod == model.PaymentMethodCash {
		if cashReceived == nil || *cashReceived < totalAmount {
			var rec int64
			if cashReceived != nil {
				rec = *cashReceived
			}
			return nil, fmt.Errorf("insufficient tender: cash received (%d) is less than total amount (%d)", rec, totalAmount)
		}
		change := *cashReceived - totalAmount
		changeGiven = &change
	} else {
		// Non-cash (card/qris)
		cashReceived = &totalAmount
		zeroChange := int64(0)
		changeGiven = &zeroChange
	}

	// 4. Insert Transaction Record
	var txID uuid.UUID
	var createdAt time.Time
	insertTxQuery := `
		INSERT INTO transactions (invoice_number, user_id, total_amount, payment_method, cash_received, change_given)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	err = tx.QueryRowContext(
		ctx,
		insertTxQuery,
		invoiceNumber,
		userID,
		totalAmount,
		paymentMethod,
		cashReceived,
		changeGiven,
	).Scan(&txID, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert transaction: %w", err)
	}

	// 5. Bulk insert Transaction Items
	for _, proc := range processedItems {
		insertItemQuery := `
			INSERT INTO transaction_items (transaction_id, product_id, quantity, price_at_sale, subtotal)
			VALUES ($1, $2, $3, $4, $5)
		`
		if _, err := tx.ExecContext(ctx, insertItemQuery, txID, proc.productID, proc.quantity, proc.price, proc.subtotal); err != nil {
			return nil, fmt.Errorf("failed to insert transaction item: %w", err)
		}

		responseItems = append(responseItems, model.TransactionItemResponse{
			ProductID:   proc.productID,
			ProductName: proc.productName,
			SKU:         proc.sku,
			Quantity:    proc.quantity,
			PriceAtSale: proc.price,
			Subtotal:    proc.subtotal,
		})
	}

	// Commit Transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &model.TransactionDetailResponse{
		ID:            txID,
		InvoiceNumber: invoiceNumber,
		Cashier: model.CashierSummary{
			ID:   userID,
			Name: cashierName,
		},
		TotalAmount:   totalAmount,
		PaymentMethod: paymentMethod,
		CashReceived:  cashReceived,
		ChangeGiven:   changeGiven,
		CreatedAt:     createdAt,
		Items:         responseItems,
	}, nil
}

func (r *transactionRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.TransactionDetailResponse, error) {
	txQuery := `
		SELECT t.id, t.invoice_number, t.user_id, u.name, t.total_amount, t.payment_method, t.cash_received, t.change_given, t.created_at
		FROM transactions t
		JOIN users u ON t.user_id = u.id
		WHERE t.id = $1
	`
	var res model.TransactionDetailResponse
	err := r.db.QueryRowContext(ctx, txQuery, id).Scan(
		&res.ID,
		&res.InvoiceNumber,
		&res.Cashier.ID,
		&res.Cashier.Name,
		&res.TotalAmount,
		&res.PaymentMethod,
		&res.CashReceived,
		&res.ChangeGiven,
		&res.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrTransactionNotFound
		}
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}

	itemsQuery := `
		SELECT ti.product_id, p.name, p.sku, ti.quantity, ti.price_at_sale, ti.subtotal
		FROM transaction_items ti
		JOIN products p ON ti.product_id = p.id
		WHERE ti.transaction_id = $1
	`
	rows, err := r.db.QueryContext(ctx, itemsQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query transaction items: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var item model.TransactionItemResponse
		if err := rows.Scan(&item.ProductID, &item.ProductName, &item.SKU, &item.Quantity, &item.PriceAtSale, &item.Subtotal); err != nil {
			return nil, fmt.Errorf("failed to scan item: %w", err)
		}
		res.Items = append(res.Items, item)
	}

	return &res, nil
}

func (r *transactionRepository) List(ctx context.Context, filterUserID *uuid.UUID, startDate, endDate *time.Time) ([]model.TransactionDetailResponse, error) {
	query := `
		SELECT t.id, t.invoice_number, t.user_id, u.name, t.total_amount, t.payment_method, t.cash_received, t.change_given, t.created_at
		FROM transactions t
		JOIN users u ON t.user_id = u.id
		WHERE 1=1
	`
	var args []interface{}
	argIdx := 1

	if filterUserID != nil {
		query += fmt.Sprintf(" AND t.user_id = $%d", argIdx)
		args = append(args, *filterUserID)
		argIdx++
	}

	if startDate != nil {
		query += fmt.Sprintf(" AND t.created_at >= $%d", argIdx)
		args = append(args, *startDate)
		argIdx++
	}

	if endDate != nil {
		query += fmt.Sprintf(" AND t.created_at <= $%d", argIdx)
		args = append(args, *endDate)
		argIdx++
	}

	query += " ORDER BY t.created_at DESC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list transactions: %w", err)
	}
	defer rows.Close()

	var results []model.TransactionDetailResponse
	for rows.Next() {
		var res model.TransactionDetailResponse
		if err := rows.Scan(
			&res.ID,
			&res.InvoiceNumber,
			&res.Cashier.ID,
			&res.Cashier.Name,
			&res.TotalAmount,
			&res.PaymentMethod,
			&res.CashReceived,
			&res.ChangeGiven,
			&res.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan transaction row: %w", err)
		}
		results = append(results, res)
	}

	return results, nil
}

func (r *transactionRepository) GetSalesReport(ctx context.Context, startDate, endDate *time.Time) (*model.SalesReportResponse, error) {
	aggQuery := `
		SELECT COALESCE(SUM(total_amount), 0), COUNT(id)
		FROM transactions
		WHERE 1=1
	`
	var args []interface{}
	argIdx := 1

	if startDate != nil {
		aggQuery += fmt.Sprintf(" AND created_at >= $%d", argIdx)
		args = append(args, *startDate)
		argIdx++
	}
	if endDate != nil {
		aggQuery += fmt.Sprintf(" AND created_at <= $%d", argIdx)
		args = append(args, *endDate)
		argIdx++
	}

	var grossRevenue int64
	var txCount int
	if err := r.db.QueryRowContext(ctx, aggQuery, args...).Scan(&grossRevenue, &txCount); err != nil {
		return nil, fmt.Errorf("failed to get sales aggregates: %w", err)
	}

	var aov int64
	if txCount > 0 {
		aov = grossRevenue / int64(txCount)
	}

	// Top selling products
	topQuery := `
		SELECT ti.product_id, p.name, p.sku, SUM(ti.quantity) as total_sold, SUM(ti.subtotal) as total_revenue
		FROM transaction_items ti
		JOIN products p ON ti.product_id = p.id
		JOIN transactions t ON ti.transaction_id = t.id
		WHERE 1=1
	`
	var topArgs []interface{}
	tIdx := 1
	if startDate != nil {
		topQuery += fmt.Sprintf(" AND t.created_at >= $%d", tIdx)
		topArgs = append(topArgs, *startDate)
		tIdx++
	}
	if endDate != nil {
		topQuery += fmt.Sprintf(" AND t.created_at <= $%d", tIdx)
		topArgs = append(topArgs, *endDate)
		tIdx++
	}
	topQuery += `
		GROUP BY ti.product_id, p.name, p.sku
		ORDER BY total_sold DESC
		LIMIT 5
	`

	rows, err := r.db.QueryContext(ctx, topQuery, topArgs...)
	if err != nil {
		return nil, fmt.Errorf("failed to get top products: %w", err)
	}
	defer rows.Close()

	var topProducts []model.TopProductSale
	for rows.Next() {
		var tp model.TopProductSale
		if err := rows.Scan(&tp.ProductID, &tp.ProductName, &tp.SKU, &tp.TotalSold, &tp.TotalVolume); err != nil {
			return nil, fmt.Errorf("failed to scan top product: %w", err)
		}
		topProducts = append(topProducts, tp)
	}

	return &model.SalesReportResponse{
		GrossRevenue:     grossRevenue,
		TransactionCount: txCount,
		AverageOrderVal:  aov,
		TopProducts:      topProducts,
	}, nil
}
