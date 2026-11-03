package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DatabaseURL        string
	DBMaxOpenConns     int
	DBMaxIdleConns     int
	JWTSecret          string
	JWTExpirationHours int
	CORSAllowedOrigins string
}

func LoadConfig() *Config {
	// Try loading .env file, ignore error if missing (e.g. In docker or production)
	if err := godotenv.Load(); err != nil {
		log.Println("Info: .env file not found, loading from environment variables")
	}

	// Default port to 3000 for Vercel compatibility; local .env can override with 8080
	port := getEnv("PORT", "3000")
	dbURL := getEnv("DATABASE_URL", "postgres://kasirku:kasirku_password@localhost:5432/kasirku_db?sslmode=disable")
	
	maxOpenStr := getEnv("DB_MAX_OPEN_CONNS", "5")
	maxOpen, err := strconv.Atoi(maxOpenStr)
	if err != nil || maxOpen <= 0 {
		maxOpen = 5
	}

	maxIdleStr := getEnv("DB_MAX_IDLE_CONNS", "5")
	maxIdle, err := strconv.Atoi(maxIdleStr)
	if err != nil || maxIdle <= 0 {
		maxIdle = 5
	}

	jwtSecret := getEnv("JWT_SECRET", "kasirku-super-secret-jwt-key-minimum-32-chars-long!")
	jwtExpHoursStr := getEnv("JWT_EXPIRATION_HOURS", "8")
	corsAllowed := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")

	jwtExpHours, err := strconv.Atoi(jwtExpHoursStr)
	if err != nil {
		jwtExpHours = 8
	}

	return &Config{
		Port:               port,
		DatabaseURL:        dbURL,
		DBMaxOpenConns:     maxOpen,
		DBMaxIdleConns:     maxIdle,
		JWTSecret:          jwtSecret,
		JWTExpirationHours: jwtExpHours,
		CORSAllowedOrigins: corsAllowed,
	}
}

func getEnv(key, defaultVal string) string {
	if val, exists := os.LookupEnv(key); exists && val != "" {
		return val
	}
	return defaultVal
}
