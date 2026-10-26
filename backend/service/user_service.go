package service

import (
	"bussin-buses/domain"
	"bussin-buses/repository"
	"mime/multipart"
)

type UserService struct {
	users  repository.UserRepository
	images ImageStore
}

func NewUserRepository(users repository.UserRepository, images ImageStore) *UserService {
	return &UserService{users, images}
}

func (s *UserService) UpdateProfilePicture(userId int, image *multipart.FileHeader) (domain.UserObject, error) {
	user, err := s.users.GetByID(userId)
	if err != nil {
		return domain.UserObject{}, err
	}

	oldFilepath := user.ProfilePictureURL
	url, err := s.images.Save(image)
	if err != nil {
		s.images.Delete(url)
		return domain.UserObject{}, err
	}

	user.ProfilePictureURL = url

	if s.users.Update(&user) != nil {
		s.images.Delete(url)
		user.ProfilePictureURL = oldFilepath
		return user, err
	}

	return user, nil
}
