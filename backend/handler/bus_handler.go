package handler

import (
	"bussin-buses/domain"
	"bussin-buses/service"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type BusHandler struct {
	svc *service.BusService
}

func NewBusHandler(svc *service.BusService) *BusHandler {
	return &BusHandler{svc: svc}
}

func (h *BusHandler) List(c *gin.Context) {
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil || limit < 1 || limit > 50 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "limit must be between 1 and 50"})
		return
	}

	var before *time.Time
	if raw := c.Query("before"); raw != "" {
		t, err := time.Parse(time.RFC3339Nano, raw)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid before timestamp"})
			return
		}
		before = &t
	}

	var userID *int
	if raw := c.Query("id"); raw != "" { // i can't use userID because userID is always set by the middle
		id, err := strconv.Atoi(raw)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid userId"})
			return
		}
		userID = &id
	}

	var beforeID *int
	if raw := c.Query("beforeId"); raw != "" {
		id, err := strconv.Atoi(raw)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid beforeId"})
			return
		}
		beforeID = &id
	}

	buses, err := h.svc.List(domain.BusFilter{
		BeforeID: beforeID,
		Before:   before,
		Search:   strings.TrimSpace(c.Query("search")),
		Limit:    limit,
		UserID:   userID,
	})
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
