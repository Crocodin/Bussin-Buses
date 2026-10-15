package domain

import "time"

type BusObject struct {
	ID          int        `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	ImageURLs   []string   `json:"imageUrls"`
	Location    string     `json:"location"`
	User        UserObject `json:"user"`
	Timestamp   time.Time  `json:"timestamp"`
}
