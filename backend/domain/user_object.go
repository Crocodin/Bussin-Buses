package domain

type UserObject struct {
	ID                int    `json:"id"`
	Username          string `json:"username"`
	ProfilePictureURL string `json:"profilePictureUrl"`
}
