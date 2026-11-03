package service

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"kasirku-backend/internal/model"
	"kasirku-backend/internal/repository"
)

type ProductService interface {
	ListProducts(ctx context.Context, search string, onlyActive bool) ([]model.Product, error)
	GetProduct(ctx context.Context, id uuid.UUID) (*model.Product, error)
	CreateProduct(ctx context.Context, req model.CreateProductRequest) (*model.Product, error)
	UpdateProduct(ctx context.Context, id uuid.UUID, req model.UpdateProductRequest) (*model.Product, error)
	DeleteProduct(ctx context.Context, id uuid.UUID) error
}

type productService struct {
	productRepo repository.ProductRepository
}

func NewProductService(productRepo repository.ProductRepository) ProductService {
	return &productService{productRepo: productRepo}
}

func (s *productService) ListProducts(ctx context.Context, search string, onlyActive bool) ([]model.Product, error) {
	return s.productRepo.List(ctx, search, onlyActive)
}

func (s *productService) GetProduct(ctx context.Context, id uuid.UUID) (*model.Product, error) {
	return s.productRepo.GetByID(ctx, id)
}

func (s *productService) CreateProduct(ctx context.Context, req model.CreateProductRequest) (*model.Product, error) {
	req.SKU = strings.TrimSpace(req.SKU)
	req.Name = strings.TrimSpace(req.Name)

	if req.SKU == "" {
		return nil, errors.New("SKU is required")
	}
	if req.Name == "" {
		return nil, errors.New("product name is required")
	}
	if req.Price < 0 {
		return nil, errors.New("price cannot be negative")
	}
	if req.Stock < 0 {
		return nil, errors.New("stock cannot be negative")
	}

	product := &model.Product{
		SKU:      req.SKU,
		Name:     req.Name,
		Price:    req.Price,
		Stock:    req.Stock,
		IsActive: true,
	}

	if err := s.productRepo.Create(ctx, product); err != nil {
		return nil, err
	}

	return product, nil
}

func (s *productService) UpdateProduct(ctx context.Context, id uuid.UUID, req model.UpdateProductRequest) (*model.Product, error) {
	product, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.SKU != nil {
		trimmed := strings.TrimSpace(*req.SKU)
		if trimmed == "" {
			return nil, errors.New("SKU cannot be empty")
		}
		product.SKU = trimmed
	}
	if req.Name != nil {
		trimmed := strings.TrimSpace(*req.Name)
		if trimmed == "" {
			return nil, errors.New("product name cannot be empty")
		}
		product.Name = trimmed
	}
	if req.Price != nil {
		if *req.Price < 0 {
			return nil, errors.New("price cannot be negative")
		}
		product.Price = *req.Price
	}
	if req.Stock != nil {
		if *req.Stock < 0 {
			return nil, errors.New("stock cannot be negative")
		}
		product.Stock = *req.Stock
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}

	if err := s.productRepo.Update(ctx, product); err != nil {
		return nil, err
	}

	return product, nil
}

func (s *productService) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	return s.productRepo.SoftDelete(ctx, id)
}
