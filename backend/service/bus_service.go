package service

import (
	"errors"
	"fmt"
	"mime/multipart"
	"strings"

	"bussin-buses/domain"
	"bussin-buses/repository"
)

const (
	MaxImages    = 10
	MaxImageSize = 10 << 20 // 10 MB
)

type ImageStore interface {
	Save(fh *multipart.FileHeader) (string, error)
	Delete(urls ...string)
}

type Notifier interface {
	SendToUser(userID int, msgType string, data any)
}

type CreateBusInput struct {
	Name        string
	Description string
	Location    string
	Images      []*multipart.FileHeader
}

type BusService struct {
	buses  repository.BusRepository
	users  repository.UserRepository
	images ImageStore
	notify Notifier
}

func NewBusService(buses repository.BusRepository, users repository.UserRepository, images ImageStore, notify Notifier) *BusService {
	return &BusService{buses: buses, users: users, images: images, notify: notify}
}

func (s *BusService) List(f domain.BusFilter) ([]domain.BusObject, error) {
	return s.buses.List(f)
}

func (s *BusService) GetByID(id int) (domain.BusObject, error) {
	return s.buses.GetByID(id)
}

func (s *BusService) Create(userID int, in CreateBusInput) (domain.BusObject, error) {
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return domain.BusObject{}, fmt.Errorf("%w: name is required", domain.ErrInvalidInput)
	}
	if n := len(in.Images); n == 0 || n > MaxImages {
		return domain.BusObject{}, fmt.Errorf("%w: send between 1 and %d images", domain.ErrInvalidInput, MaxImages)
	}
	for _, fh := range in.Images {
		if fh.Size > MaxImageSize {
			return domain.BusObject{}, domain.ErrFileTooLarge
		}
	}

	user, err := s.users.GetByID(userID)
	if errors.Is(err, domain.ErrNotFound) {
		return domain.BusObject{}, domain.ErrUnauthorized
	}
	if err != nil {
		return domain.BusObject{}, err
	}

	urls := make([]string, 0, len(in.Images))
	for _, fh := range in.Images {
		url, err := s.images.Save(fh)
		if err != nil {
			s.images.Delete(urls...) // undo the files saved so far
			return domain.BusObject{}, err
		}
		urls = append(urls, url)
	}

	bus := domain.BusObject{
		Name:        name,
		Description: in.Description,
		Location:    in.Location,
		ImageURLs:   urls,
		// copy only the public fields, so the email never goes out in a bus
		User: domain.UserObject{ID: user.ID, Username: user.Username, ProfilePictureURL: user.ProfilePictureURL},
	}
	if err := s.buses.Create(&bus); err != nil {
		s.images.Delete(urls...)
		return domain.BusObject{}, err
	}

	s.notify.SendToUser(userID, "post_added", bus)
	return bus, nil
}
