package domain

type UserObject struct {
	ID                int    `json:"id"`
	Username          string `json:"username"`
	Email             string `json:"email,omitempty"`
	PasswordHash      string `json:"-"`
	ProfilePictureURL string `json:"profilePictureUrl"`
}
