package repository

import (
	"database/sql"
	"errors"
	"time"

	"bussin-buses/domain"
)

var ErrNotFound = errors.New("not found")

type BusRepository interface {
	List() ([]domain.BusObject, error)
	ListForUserId(id int) ([]domain.BusObject, error)
	GetByID(id int) (domain.BusObject, error)
	Create(bus *domain.BusObject) error
	Update(bus *domain.BusObject) error
	Delete(id int) error
}

type SQLiteBusRepository struct {
	db *sql.DB
}

func NewSQLiteBusRepository(db *sql.DB) *SQLiteBusRepository {
	return &SQLiteBusRepository{db: db}
}

const selectBus = `
	SELECT b.id, b.name, b.description, b.location, b.created_at,
	       u.id, u.username, u.profile_picture_url
	FROM buses b JOIN users u ON u.id = b.user_id`

func scanBus(row interface{ Scan(...any) error }) (domain.BusObject, error) {
	var b domain.BusObject
	err := row.Scan(&b.ID, &b.Name, &b.Description, &b.Location, &b.Timestamp,
		&b.User.ID, &b.User.Username, &b.User.ProfilePictureURL)
	return b, err
}

func (r *SQLiteBusRepository) imageURLs(busID int) ([]string, error) {
	rows, err := r.db.Query(`SELECT url FROM bus_images WHERE bus_id = ? ORDER BY position`, busID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	urls := []string{} // not nil, so JSON gives [] instead of null
	for rows.Next() {
		var u string
		if err := rows.Scan(&u); err != nil {
			return nil, err
		}
		urls = append(urls, u)
	}
	return urls, rows.Err()
}

func (r *SQLiteBusRepository) GetByID(id int) (domain.BusObject, error) {
	b, err := scanBus(r.db.QueryRow(selectBus+` WHERE b.id = ?`, id))
	if errors.Is(err, sql.ErrNoRows) {
		return b, ErrNotFound
	}
	if err != nil {
		return b, err
	}
	b.ImageURLs, err = r.imageURLs(b.ID)
	return b, err
}

func (r *SQLiteBusRepository) List() ([]domain.BusObject, error) {
	rows, err := r.db.Query(selectBus + ` ORDER BY b.created_at DESC`)
	if err != nil {
		return nil, err
	}

	buses := []domain.BusObject{}
	for rows.Next() {
		b, err := scanBus(rows)
		if err != nil {
			rows.Close()
			return nil, err
		}
		buses = append(buses, b)
	}
	rows.Close() // close BEFORE running more queries (we only have 1 connection)
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := range buses {
		if buses[i].ImageURLs, err = r.imageURLs(buses[i].ID); err != nil {
			return nil, err
		}
	}
	return buses, nil
}

func (r *SQLiteBusRepository) ListForUserId(userId int) ([]domain.BusObject, error) {
	rows, err := r.db.Query(selectBus+" WHERE u.id = ?", userId)
	if err != nil {
		return nil, err
	}

	buses := []domain.BusObject{}
	for rows.Next() {
		b, err := scanBus(rows)
		if err != nil {
			rows.Close()
			return nil, err
		}
		buses = append(buses, b)
	}
	rows.Close()

	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := range buses {
		if buses[i].ImageURLs, err = r.imageURLs(buses[i].ID); err != nil {
			return nil, err
		}
	}
	return buses, nil
}

func (r *SQLiteBusRepository) Create(bus *domain.BusObject) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback() // does nothing if Commit already succeeded

	bus.Timestamp = time.Now().UTC()
	res, err := tx.Exec(
		`INSERT INTO buses (name, description, location, user_id, created_at) VALUES (?, ?, ?, ?, ?)`,
		bus.Name, bus.Description, bus.Location, bus.User.ID, bus.Timestamp)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	bus.ID = int(id)

	for i, url := range bus.ImageURLs {
		if _, err := tx.Exec(
			`INSERT INTO bus_images (bus_id, url, position) VALUES (?, ?, ?)`, bus.ID, url, i); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *SQLiteBusRepository) Update(bus *domain.BusObject) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	res, err := tx.Exec(
		`UPDATE buses SET name = ?, description = ?, location = ? WHERE id = ?`,
		bus.Name, bus.Description, bus.Location, bus.ID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}

	// simplest approach: replace the image list
	if _, err := tx.Exec(`DELETE FROM bus_images WHERE bus_id = ?`, bus.ID); err != nil {
		return err
	}
	for i, url := range bus.ImageURLs {
		if _, err := tx.Exec(
			`INSERT INTO bus_images (bus_id, url, position) VALUES (?, ?, ?)`, bus.ID, url, i); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *SQLiteBusRepository) Delete(id int) error {
	res, err := r.db.Exec(`DELETE FROM buses WHERE id = ?`, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}
