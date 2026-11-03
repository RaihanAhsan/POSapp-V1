package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"kasirku-backend/internal/config"
	"kasirku-backend/internal/model"
	"kasirku-backend/internal/repository"
	"kasirku-backend/internal/service"
)

// MockUserRepository implements repository.UserRepository for testing
type mockUserRepo struct {
	users map[uuid.UUID]*model.User
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{
		users: make(map[uuid.UUID]*model.User),
	}
}

func (m *mockUserRepo) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	for _, u := range m.users {
		if u.Email == email {
			copied := *u
			return &copied, nil
		}
	}
	return nil, repository.ErrUserNotFound
}

func (m *mockUserRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	u, ok := m.users[id]
	if !ok {
		return nil, repository.ErrUserNotFound
	}
	copied := *u
	return &copied, nil
}

func (m *mockUserRepo) List(ctx context.Context) ([]model.User, error) {
	var list []model.User
	for _, u := range m.users {
		list = append(list, *u)
	}
	return list, nil
}

func (m *mockUserRepo) Create(ctx context.Context, user *model.User) error {
	user.ID = uuid.New()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	m.users[user.ID] = user
	return nil
}

func (m *mockUserRepo) Update(ctx context.Context, user *model.User) error {
	user.UpdatedAt = time.Now()
	m.users[user.ID] = user
	return nil
}

func TestUpdateUser(t *testing.T) {
	repo := newMockUserRepo()
	cfg := &config.Config{
		JWTSecret:          "test-secret-at-least-32-chars-long!",
		JWTExpirationHours: 8,
	}
	authSvc := service.NewAuthService(repo, cfg)

	// Create initial test user
	initialUser := &model.User{
		Email:        "cashier1@posv1.local",
		PasswordHash: "hashed-pw",
		Name:         "Cashier One",
		Role:         model.RoleStaff,
		IsActive:     true,
	}
	_ = repo.Create(context.Background(), initialUser)

	ctx := context.Background()

	// 1. Test updating name and email
	newName := "Cashier Updated Name"
	newEmail := "cashier.updated@posv1.local"
	res, err := authSvc.UpdateUser(ctx, initialUser.ID, model.UpdateUserRequest{
		Name:  &newName,
		Email: &newEmail,
	})
	if err != nil {
		t.Fatalf("unexpected error updating user: %v", err)
	}
	if res.Name != newName {
		t.Errorf("expected name %s, got %s", newName, res.Name)
	}
	if res.Email != newEmail {
		t.Errorf("expected email %s, got %s", newEmail, res.Email)
	}

	// 2. Test updating password with valid length
	newPassword := "newSecret123"
	_, err = authSvc.UpdateUser(ctx, initialUser.ID, model.UpdateUserRequest{
		Password: &newPassword,
	})
	if err != nil {
		t.Fatalf("unexpected error updating password: %v", err)
	}

	// Verify new password works for login
	loginRes, err := authSvc.Login(ctx, model.LoginRequest{
		Email:    newEmail,
		Password: newPassword,
	})
	if err != nil {
		t.Fatalf("expected login to succeed with new password, got: %v", err)
	}
	if loginRes.User.Email != newEmail {
		t.Errorf("expected user email %s, got %s", newEmail, loginRes.User.Email)
	}

	// 3. Test short password rejection
	shortPassword := "12345"
	_, err = authSvc.UpdateUser(ctx, initialUser.ID, model.UpdateUserRequest{
		Password: &shortPassword,
	})
	if err == nil {
		t.Errorf("expected error for short password, got nil")
	}

	// 4. Test duplicate email rejection
	otherUser := &model.User{
		Email:        "existing@posv1.local",
		PasswordHash: "hashed-pw",
		Name:         "Existing Staff",
		Role:         model.RoleStaff,
		IsActive:     true,
	}
	_ = repo.Create(ctx, otherUser)

	duplicateEmail := "existing@posv1.local"
	_, err = authSvc.UpdateUser(ctx, initialUser.ID, model.UpdateUserRequest{
		Email: &duplicateEmail,
	})
	if err == nil {
		t.Errorf("expected error for duplicate email, got nil")
	}
}
