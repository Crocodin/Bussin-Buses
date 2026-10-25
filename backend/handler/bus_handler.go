package handler

import (
	"net/http"
	"strconv"

	"bussin-buses/service"

	"github.com/gin-gonic/gin"
)

type BusHandler struct {
	svc *service.BusService
}

func NewBusHandler(svc *service.BusService) *BusHandler {
	return &BusHandler{svc: svc}
}

func (h *BusHandler) ListForUserId(c *gin.Context) {
	userId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}
	buses, err := h.svc.ListForUserId(userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, buses)
}

func (h *BusHandler) List(c *gin.Context) {
	buses, err := h.svc.List()
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, buses)
}

func (h *BusHandler) Get(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid bus id"})
		return
	}
	bus, err := h.svc.GetByID(id)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, bus)
}

func (h *BusHandler) Create(c *gin.Context) {
	// cap the whole request body before parsing it
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, service.MaxImages*service.MaxImageSize)

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form or request too large"})
		return
	}

	bus, err := h.svc.Create(c.GetInt("userID"), service.CreateBusInput{
		Name:        c.PostForm("name"),
		Description: c.PostForm("description"),
		Location:    c.PostForm("location"),
		Images:      form.File["images"],
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, bus)
}
