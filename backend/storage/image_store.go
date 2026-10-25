package storage

import (
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"bussin-buses/domain"

	"github.com/google/uuid"
)

const URLPrefix = "/uploads/"

var allowedTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

type ImageStore struct {
	dir string
}

func NewImageStore(dir string) (*ImageStore, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	return &ImageStore{dir: dir}, nil
}

// Save validates one uploaded file, writes it to disk and returns its URL path.
func (s *ImageStore) Save(fh *multipart.FileHeader) (string, error) {
	src, err := fh.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	buf := make([]byte, 512)
	n, err := src.Read(buf)
	if err != nil && err != io.EOF {
		return "", err
	}
	ext, ok := allowedTypes[http.DetectContentType(buf[:n])]
	if !ok {
		return "", domain.ErrUnsupportedImage
	}
	if _, err := src.Seek(0, io.SeekStart); err != nil {
		return "", err
	}

	filename := uuid.NewString() + ext
	path := filepath.Join(s.dir, filename)

	dst, err := os.Create(path)
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(dst, src); err != nil {
		dst.Close()
		os.Remove(path)
		return "", err
	}
	if err := dst.Close(); err != nil {
		os.Remove(path)
		return "", err
	}
	return URLPrefix + filename, nil
}

// Delete removes files by URL path. filepath.Base stops "../" tricks.
func (s *ImageStore) Delete(urls ...string) {
	for _, u := range urls {
		os.Remove(filepath.Join(s.dir, filepath.Base(u)))
	}
}
