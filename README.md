# Bussin' Buses: the Instagram of buses

Bussin' Buses is a bus spotting app. Users upload pictures of buses they've seen, and the app shows them in a feed with details about each bus. The app keeps working offline: buses added without a connection are stored on the device and sent to the server automatically when it is reachable again.

<div>
 <img src='./docs/Screen Shot 2026-10-28 at 16.02.21.png' height=500px style="display: block; margin-left: auto; margin-right: auto;">
<div>

## Features

- **Authentication:** register, log in and log out. The JWT is stored in local storage, and logged-in users skip the login page on startup.
- **Master-detail UI:** a 3-column grid of bus previews (master) opens a detail page with all images, the description and the location.
- **Infinite scroll:** the feed is loaded in pages using cursor-based pagination.
- **Search and filter:** search by bus name and filter by date.
- **Add buses:** upload several pictures with a name, description and location.
- **Profile page:** shows your buses and lets you change your profile picture.
- **Real-time notifications:** new buses are pushed to the app over a WebSocket.
- **Network status:** a banner shows when the app or the server is unreachable.
- **Offline support:**
  - In online mode, new buses are sent to the REST API first.
  - If the app is offline or the request fails, the bus is saved locally and a banner shows how many items have not been sent.
  - When the connection returns, the queued items are sent automatically, in order.
  - The last loaded feed is cached locally and can be browsed and searched offline.

## Architecture

- **Frontend:** Ionic with React, TypeScript and Vite (axios for HTTP, IndexedDB via `idb-keyval` for the offline queue, `localStorage` for the token and the cached feed)
- **Backend:** Go with the Gin Web Framework, organized in layers: router → handler → service → repository
- **API:** RESTful, secured with JWT bearer tokens
- **WebSocket:** `gorilla/websocket`, authenticated with the JWT on connect, and notifications are sent only to the user who owns the resource
- **Database:** SQLite on the server (`modernc.org/sqlite`, pure Go, no C compiler needed)
- **Images:** stored on the server's disk in `uploads/` under random names, and only the path is stored in the database
- **Passwords:** hashed with bcrypt

## How to run?

>[!NOTE] You need go version 1.27.2 and Node.js and the Ionic CLI

### Backend

```bash
cd backend
go mod download
$env:JWT_SECRET = "a-long-random-string" # PowerShell
go run .
```

The server runs on `http://localhost:8080` and creates `bussin.db` and `uploads/` on first start. If `JWT_SECRET` is not set, an insecure development secret is used and a warning is printed.

### Frontend

```bash
cd frontend
npm install
ionic serve
```

## Known limitations

- Uploaded images are served without authentication (the filenames are random UUIDs and can't be guessed).
- The WebSocket token is sent in the URL because browsers can't set headers on WebSockets.
- If a request reaches the server but the response is lost, the retry can create a duplicate. An idempotency key would fix this.
- Offline, only the data that was already loaded is available, and the images themselves still come from the server.