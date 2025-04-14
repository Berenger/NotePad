# 📝 NotePad

NotePad is a real-time collaborative note-taking application. It allows multiple users to simultaneously edit the same document through a simple and intuitive interface, with instant synchronization between all participants.

----------

## 🧠 Key Features

-   ✍️ Real-time collaborative editing
    
-   🔗 Shareable documents via unique URLs
    
-   💾 Server-side data persistence
    
-   📄 Multi-document support using page identifiers
   
----------

## 🛠️ Tech Stack

-   **Backend**: Go, WebSockets (`gorilla/websocket`)
    
-   **Frontend**: React, WebSockets
    

----------

## 📦 Backend

### 📋 Description

The Go server manages WebSocket connections, synchronizes changes between clients, and saves documents in text files.

### ⚙️ Requirements

-   Go **1.16+**
    
-   `github.com/gorilla/websocket` module
    

### 🚀 Installation & Usage

1.  Clone the repository:
    

```
git clone git@github.com:Berenger/NotePad.git
cd NotePad/backend
```

2.  Install dependencies:
    

```
go mod download
```

3.  Start the server (default port: `8080`):
    

```
go run main.go
```

4.  Start with a custom port:
    

```
go run main.go -port 3000
```

5.  (Optional) Build the executable:
    

```
go build -o notepad
./notepad -port 8080
```

### 🔐 Security

> **Note:** By default, the server accepts WebSocket connections from **any origin**. This should be changed before deploying to production.

### ⚠️ Limitations

-   No authentication system
    
-   No conflict resolution (last write wins)
    
-   No WebSocket compression
    

----------

## 🎨 Frontend

### 📋 Description

A modern React interface for collaborative editing. It enables real-time document updates by maintaining a persistent WebSocket connection to the server.

### ⚙️ Requirements

-   Node.js **14.x+**
    
-   npm **6.x+**
    
-   A running instance of the backend server
    

### 🚀 Installation & Usage

1.  Clone the repository:
    

```
git clone git@github.com:Berenger/NotePad.git
cd NotePad
```

2.  Install dependencies:
    

```
npm install
```

3.  Create the environment file:
    

```
cp .env.example .env
```

Example configuration:

```
REACT_APP_WS_URL=ws://localhost:8080/ws
```

> Adjust the WebSocket URL according to your backend server location.

4.  Start the development server:
    

```
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 🏗️ Production Build

Generate an optimized production build:

```
npm run build
```

----------

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or a pull request.

----------

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
