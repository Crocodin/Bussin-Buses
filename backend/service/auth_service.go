package service

import (
	"errors"
	"strings"

	"bussin-buses/domain"
	auth "bussin-buses/jwt"
	"bussin-buses/repository"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	users  repository.UserRepository
	secret []byte
}

func NewAuthService(users repository.UserRepository, secret []byte) *AuthService {
	return &AuthService{users: users, secret: secret}
}

func (s *AuthService) Register(username, email, password string) (domain.UserObject, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return domain.UserObject{}, err
	}
	user := domain.UserObject{
		Username:     strings.TrimSpace(username),
		Email:        strings.ToLower(strings.TrimSpace(email)),
		PasswordHash: string(hash),
	}
	if err := s.users.Create(&user); err != nil { // returns domain.ErrDuplicate if taken
		return domain.UserObject{}, err
	}
	return user, nil
}

// Login returns a signed token and the user.
func (s *AuthService) Login(email, password string) (string, domain.UserObject, error) {
	user, err := s.users.GetByEmail(strings.ToLower(strings.TrimSpace(email)))
	if errors.Is(err, domain.ErrNotFound) {
		return "", domain.UserObject{}, domain.ErrInvalidCredentials
	}
	if err != nil {
		return "", domain.UserObject{}, err
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)) != nil {
		return "", domain.UserObject{}, domain.ErrInvalidCredentials
	}
	token, err := auth.CreateToken(s.secret, user.ID)
	if err != nil {
		return "", domain.UserObject{}, err
	}
	return token, user, nil
}
