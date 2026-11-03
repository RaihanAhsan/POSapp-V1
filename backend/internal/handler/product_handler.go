package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"kasirku-backend/internal/model"
	"kasirku-backend/internal/repository"
	"kasirku-backend/internal/service"
)

type ProductHandler struct {
	productService service.ProductService
}

func NewProductHandler(productService service.ProductService) *ProductHandler {
	return &ProductHandler{productService: productService}
}

func (h *ProductHandler) ListProducts(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	onlyActiveStr := r.URL.Query().Get("only_active")
	onlyActive := true
	if onlyActiveStr != "" {
		if parsed, err := strconv.ParseBool(onlyActiveStr); err == nil {
			onlyActive = parsed
		}
	}

	products, err := h.productService.ListProducts(r.Context(), search, onlyActive)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve products")
		return
	}

	RespondSuccess(w, http.StatusOK, products)
}

func (h *ProductHandler) GetProduct(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "INVALID_ID", "Invalid product ID format")
		return
	}

	product, err := h.productService.GetProduct(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrProductNotFound) {
			RespondError(w, http.StatusNotFound, "NOT_FOUND", "Product not found")
			return
		}
		RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get product")
		return
	}

	RespondSuccess(w, http.StatusOK, product)
}

func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req model.CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse request body")
		return
	}

	product, err := h.productService.CreateProduct(r.Context(), req)
	if err != nil {
		if errors.Is(err, repository.ErrSKUAlreadyExists) {
			RespondError(w, http.StatusConflict, "SKU_EXISTS", "A product with this SKU already exists")
			return
		}
		RespondError(w, http.StatusBadRequest, "CREATE_FAILED", err.Error())
		return
	}

	RespondSuccess(w, http.StatusCreated, product)
}

func (h *ProductHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "INVALID_ID", "Invalid product ID format")
		return
	}

	var req model.UpdateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse request body")
		return
	}

	product, err := h.productService.UpdateProduct(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, repository.ErrProductNotFound) {
			RespondError(w, http.StatusNotFound, "NOT_FOUND", "Product not found")
			return
		}
		if errors.Is(err, repository.ErrSKUAlreadyExists) {
			RespondError(w, http.StatusConflict, "SKU_EXISTS", "A product with this SKU already exists")
			return
		}
		RespondError(w, http.StatusBadRequest, "UPDATE_FAILED", err.Error())
		return
	}

	RespondSuccess(w, http.StatusOK, product)
}

func (h *ProductHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "INVALID_ID", "Invalid product ID format")
		return
	}

	if err := h.productService.DeleteProduct(r.Context(), id); err != nil {
		if errors.Is(err, repository.ErrProductNotFound) {
			RespondError(w, http.StatusNotFound, "NOT_FOUND", "Product not found")
			return
		}
		RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete product")
		return
	}

	RespondSuccess(w, http.StatusOK, map[string]string{"message": "Product deactivated successfully"})
}
