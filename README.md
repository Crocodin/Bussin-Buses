# Bussin' Buses -- the Instagram of buses

Bussin' Buses is a bus spotting app. Users upload pictures of buses they've seen, and the app displays additional information about each picture. Users can browse the buses that they and their friends have uploaded in the last 7 days.

## Features

- Feed of bus pictures uploaded by you and your friends in the last 7 days
- Detailed information for each bus picture
- Search and filter by bus number, route, and location
- Add, edit, and remove bus pictures and their information
- User authentication
- Offline-first: view saved bus pictures from a local database and sync with the remote server when online
- Google Maps integration to show where each picture was taken
- Camera integration to photograph buses directly from the app

## Architecture

- **Frontend:** Ionic with React (Capacitor for native features such as the camera)
- **Backend:** Go with the Gin Web Framework
- **API:** RESTful, used for communication between the app and the backend
- **Database:** SQLite on both sides: the Capacitor SQLite plugin on the device and SQLite on the server
- **Authentication:** JWT
