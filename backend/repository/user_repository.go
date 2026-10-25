package repository

import (
	"database/sql"
	"errors"
	"strings"

	"bussin-buses/domain"
)

var ErrDuplicate = errors.New("already exists")

type UserRepository interface {
	GetByID(id int) (domain.UserObject, error)
	GetByEmail(email string) (domain.UserObject, error)
	Create(user *domain.UserObject) error
	Update(user *domain.UserObject) error // only updates the profile picture
	Delete(id int) error
}

type SQLiteUserRepository struct {
	db *sql.DB
}

func NewSQLiteUserRepository(db *sql.DB) *SQLiteUserRepository {
	return &SQLiteUserRepository{db: db}
}

const selectUser = `
	SELECT u.id, u.username, u.email, u.profile_picture_url, u.password_hash
	FROM users u`

func scanUser(row interface{ Scan(...any) error }) (domain.UserObject, error) {
	var u domain.UserObject
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.ProfilePictureURL, &u.PasswordHash)
	return u, err
}

func (r *SQLiteUserRepository) getOne(where string, arg any) (domain.UserObject, error) {
	u, err := scanUser(r.db.QueryRow(selectUser+where, arg))
	if errors.Is(err, sql.ErrNoRows) {
		return u, ErrNotFound
	}
	return u, err
}

func (r *SQLiteUserRepository) GetByID(id int) (domain.UserObject, error) {
	return r.getOne(` WHERE u.id = ?`, id)
}

func (r *SQLiteUserRepository) GetByEmail(email string) (domain.UserObject, error) {
	return r.getOne(` WHERE u.email = ?`, email)
}

func (r *SQLiteUserRepository) Create(user *domain.UserObject) error {
	res, err := r.db.Exec(
		`INSERT INTO users (username, email, password_hash, profile_picture_url) VALUES (?, ?, ?, ?)`,
		user.Username, user.Email, user.PasswordHash, user.ProfilePictureURL)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return ErrDuplicate
		}
		return err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	user.ID = int(id)
	return nil
}

func (r *SQLiteUserRepository) Update(user *domain.UserObject) error {
	res, err := r.db.Exec(`UPDATE users SET profile_picture_url = ? WHERE id = ?`, user.ProfilePictureURL, user.ID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *SQLiteUserRepository) Delete(id int) error {
	res, err := r.db.Exec(`DELETE FROM users WHERE id = ?`, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}
