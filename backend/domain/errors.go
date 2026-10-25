package domain

import "errors"

var (
	ErrNotFound           = errors.New("not found")
	ErrDuplicate          = errors.New("username or email already taken")
	ErrInvalidInput       = errors.New("invalid input")
	ErrInvalidCredentials = errors.New("wrong email or password")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrUnsupportedImage   = errors.New("only JPEG, PNG and WebP are allowed")
	ErrFileTooLarge       = errors.New("image too large (max 10 MB)")
)
