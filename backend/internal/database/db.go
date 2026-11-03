package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

func InitDB(databaseURL string, maxOpenConns, maxIdleConns int) (*sql.DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if maxOpenConns <= 0 {
		maxOpenConns = 5
	}
	if maxIdleConns <= 0 {
		maxIdleConns = 5
	}

	// Conservative connection pool settings for serverless / pooled PostgreSQL (Neon/Supabase)
	db.SetMaxOpenConns(maxOpenConns)
	db.SetMaxIdleConns(maxIdleConns)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(1 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("PostgreSQL connection established successfully (Pool: maxOpen=%d, maxIdle=%d)", maxOpenConns, maxIdleConns)
	return db, nil
}
