package ws

import (
	auth "bussin-buses/jwt"
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Message struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type client struct {
	conn   *websocket.Conn
	send   chan []byte
	userID int
}

type Hub struct {
	mu      sync.Mutex // the clients map is touched from many goroutines
	clients map[*client]struct{}
	secret  []byte
}

func NewHub(secret []byte) *Hub {
	return &Hub{clients: make(map[*client]struct{}), secret: secret}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return r.Header.Get("Origin") == "http://localhost:8100"
	},
}

func (h *Hub) remove(c *client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.clients[c]; ok {
		delete(h.clients, c)
		close(c.send) // tells the writer goroutine to stop
	}
}

func (h *Hub) SendToUser(userID int, msgType string, data any) {
	payload, err := json.Marshal(Message{Type: msgType, Data: data})
	if err != nil {
		log.Println("ws marshal:", err)
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	for c := range h.clients {
		if c.userID != userID {
			continue
		}
		select {
		case c.send <- payload:
		default:
			delete(h.clients, c)
			close(c.send)
		}
	}
}

// Handle is the Gin handler for GET /ws.
func (h *Hub) Handle(c *gin.Context) {
	userID, err := auth.VerifyToken(h.secret, c.Query("token"))
	if err != nil {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("ws upgrade:", err)
		return
	}
	cl := &client{conn: conn, send: make(chan []byte, 16), userID: userID}

	h.mu.Lock()
	h.clients[cl] = struct{}{}
	h.mu.Unlock()

	// Writer goroutine: gorilla allows only ONE concurrent writer per connection,
	// so all writes go through this channel.
	go func() {
		defer conn.Close()
		for msg := range cl.send {
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}()

	// Reader loop: we ignore incoming messages, but reading is how we notice a disconnect.
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
	h.remove(cl)
	conn.Close()
}
