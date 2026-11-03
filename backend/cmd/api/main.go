package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"kasirku-backend/internal/config"
	"kasirku-backend/internal/database"
	"kasirku-backend/internal/handler"
	"kasirku-backend/internal/middleware"
	"kasirku-backend/internal/model"
	"kasirku-backend/internal/repository"
	"kasirku-backend/internal/service"
)

func main() {
	cfg := config.LoadConfig()

	db, err := database.InitDB(cfg.DatabaseURL, cfg.DBMaxOpenConns, cfg.DBMaxIdleConns)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer db.Close()

	// Initialize Repositories
	userRepo := repository.NewUserRepository(db)
	productRepo := repository.NewProductRepository(db)
	txRepo := repository.NewTransactionRepository(db)

	// Initialize Services
	authService := service.NewAuthService(userRepo, cfg)
	productService := service.NewProductService(productRepo)
	txService := service.NewTransactionService(txRepo)

	// Initialize Handlers
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(authService)
	productHandler := handler.NewProductHandler(productService)
	txHandler := handler.NewTransactionHandler(txService)
	reportHandler := handler.NewReportHandler(txService)

	// Setup Router
	r := chi.NewRouter()

	// Global Middlewares
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.NewCORSMiddleware(cfg.CORSAllowedOrigins))

	// Health Check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		handler.RespondSuccess(w, http.StatusOK, map[string]string{
			"status":  "healthy",
			"service": "POSv1 API",
		})
	})

	// API Routes
	r.Route("/api", func(api chi.Router) {
		// Public Auth
		api.Post("/auth/login", authHandler.Login)

		// Protected Routes (Staff & Admin)
		api.Group(func(protected chi.Router) {
			protected.Use(middleware.AuthMiddleware(authService))

			// User self info
			protected.Get("/auth/me", authHandler.GetMe)

			// Catalog (read-only for staff & admin)
			protected.Get("/products", productHandler.ListProducts)
			protected.Get("/products/{id}", productHandler.GetProduct)

			// POS Checkout & Transactions
			protected.Post("/transactions", txHandler.Checkout)
			protected.Get("/transactions", txHandler.ListTransactions)
			protected.Get("/transactions/{id}", txHandler.GetTransaction)

			// Protected Routes (Admin Only)
			protected.Group(func(admin chi.Router) {
				admin.Use(middleware.RequireRole(model.RoleAdmin))

				// Product Management CRUD
				admin.Post("/products", productHandler.CreateProduct)
				admin.Put("/products/{id}", productHandler.UpdateProduct)
				admin.Delete("/products/{id}", productHandler.DeleteProduct)

				// User Management
				admin.Get("/users", userHandler.ListUsers)
				admin.Post("/users", userHandler.CreateUser)
				admin.Put("/users/{id}", userHandler.UpdateUser)

				// Sales Reports & Analytics
				admin.Get("/reports/sales", reportHandler.GetSalesReport)
			})
		})
	})

	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("POSv1 Go API Server running on http://localhost%s", serverAddr)
	if err := http.ListenAndServe(serverAddr, r); err != nil {
		log.Fatalf("Server terminated: %v", err)
	}
}
