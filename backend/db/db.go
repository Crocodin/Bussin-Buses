package db

import (
	"database/sql"

	_ "modernc.org/sqlite"
)

const schema = `
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	profile_picture_url TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS buses (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	location TEXT NOT NULL DEFAULT '',
	user_id INTEGER NOT NULL REFERENCES users(id),
	created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS bus_images (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
	url TEXT NOT NULL,
	position INTEGER NOT NULL
);`

func Open(path string) (*sql.DB, error) {
	conn, err := sql.Open("sqlite", "file:"+path+"?_pragma=foreign_keys(1)")
	if err != nil {
		return nil, err
	}
	conn.SetMaxOpenConns(1) // avoids "database is locked" errors with SQLite
	if _, err := conn.Exec(schema); err != nil {
		return nil, err
	}
	return conn, nil
}
