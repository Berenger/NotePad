package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"

	"github.com/gorilla/websocket"
)

// Client structure to store client connections
type Client struct {
	conn *websocket.Conn // WebSocket connection
	send chan []byte     // Channel to send messages to the client
}

// Map to synchronize editors by pageId
var pageEditors = make(map[string]map[*Client]bool)
var fileMux = make(map[string]*sync.Mutex) // Mutex per file / Mutex par fichier
var mux sync.Mutex                         // Global mutex for map access

// Directory to store files
// Dossier pour stocker les fichiers
const storageDir = "./pages"

// WebSocket handler configuration
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins - adjust according to your security needs
	},
}

// Handle WebSocket connections
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading to WebSocket:", err)
		return
	}

	// Get pageId from URL query parameters
	pageId := r.URL.Query().Get("pageId")
	if pageId == "" {
		log.Println("Missing pageId")
		conn.Close()
		return
	}

	client := &Client{
		conn: conn,
		send: make(chan []byte),
	}

	// Ensure the mutex exists for this file
	mux.Lock()
	if fileMux[pageId] == nil {
		fileMux[pageId] = &sync.Mutex{}
	}
	mux.Unlock()

	// Add the client to the editors list for this page
	addClient(client, pageId)

	// Launch a goroutine to write messages
	go writeMessages(client)

	// Send file history to the new client
	sendHistoryToClient(client, pageId)

	// Read messages from the client
	readMessages(client, pageId)
}

// Send file history to a newly connected client
func sendHistoryToClient(client *Client, pageId string) {
	filePath := getFilePath(pageId)

	// Check if the file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return // File doesn't exist yet
	}

	fileMux[pageId].Lock()
	defer fileMux[pageId].Unlock()

	// Read file content
	content, err := os.ReadFile(filePath)
	if err != nil {
		return
	}

	// Send content to client
	if len(content) > 0 {
		client.send <- content
	}
}

// Read incoming messages from a client
func readMessages(client *Client, pageId string) {
	defer func() {
		client.conn.Close()
		removeClient(client, pageId)
	}()

	for {
		_, msg, err := client.conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		// Save message to file
		saveMessageToFile(pageId, msg)

		// Broadcast message to other clients
		broadcastMessage(pageId, msg)
	}
}

// Write messages to a client
func writeMessages(client *Client) {
	defer client.conn.Close()

	for msg := range client.send {
		err := client.conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Println("Write error:", err)
			break
		}
	}
}

// Add a client to a page
func addClient(client *Client, pageId string) {
	mux.Lock()
	defer mux.Unlock()

	if pageEditors[pageId] == nil {
		pageEditors[pageId] = make(map[*Client]bool)
	}
	pageEditors[pageId][client] = true
}

// Remove a client from a page
func removeClient(client *Client, pageId string) {
	mux.Lock()
	defer mux.Unlock()

	if pageEditors[pageId] != nil {
		delete(pageEditors[pageId], client)
		if len(pageEditors[pageId]) == 0 {
			delete(pageEditors, pageId)
		}
	}
	close(client.send)
}

// Broadcast a message to all clients on a page
func broadcastMessage(pageId string, msg []byte) {
	mux.Lock()
	defer mux.Unlock()

	clientCount := 0
	for client := range pageEditors[pageId] {
		select {
		case client.send <- msg:
			clientCount++
		default:
			delete(pageEditors[pageId], client)
			close(client.send)
		}
	}
}

// Save a message to a file
func saveMessageToFile(pageId string, msg []byte) {
	// Get the file-specific mutex
	mux.Lock()
	mutex := fileMux[pageId]
	mux.Unlock()

	// Lock file access
	mutex.Lock()
	defer mutex.Unlock()

	// Create directory if it doesn't exist
	if err := os.MkdirAll(storageDir, 0755); err != nil {
		log.Println("Error creating directory:", err)
		return
	}

	// File path
	filePath := getFilePath(pageId)

	// Write to file
	if err := os.WriteFile(filePath, msg, 0644); err != nil {
		log.Println("Error writing to file:", err)
	}
}

// Get file path for a pageId
func getFilePath(pageId string) string {
	return filepath.Join(storageDir, fmt.Sprintf("%s.txt", pageId))
}

func main() {
	// Define port flag
	portPtr := flag.String("port", "8080", "port the server will listen on")

	// Parse command line flags
	flag.Parse()

	// Create storage directory if it doesn't exist
	if err := os.MkdirAll(storageDir, 0755); err != nil {
		log.Fatalf("Error creating storage directory: %v", err)
	}

	http.HandleFunc("/ws", handleWebSocket)

	port := ":" + *portPtr
	fmt.Println("Server listening on port", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
