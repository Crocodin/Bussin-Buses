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

type BusFilter struct {
	BeforeID *int       // for pagination
	Before   *time.Time // only buses created before this moment (the pagination cursor)
	Search   string     // substring of the bus name
	Limit    int
	UserID   *int
}
