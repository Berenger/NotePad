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

// Structure pour stocker les connexions des clients
type Client struct {
	conn *websocket.Conn
	send chan []byte
}

// Map pour synchroniser les éditeurs par pageId
var pageEditors = make(map[string]map[*Client]bool)
var fileMux = make(map[string]*sync.Mutex) // Mutex par fichier
var mux sync.Mutex

// Dossier pour stocker les fichiers
const storageDir = "./pages"

// Gestionnaire WebSocket
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Autoriser toutes les origines, ajustez selon votre sécurité
	},
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Erreur lors de la mise à niveau WebSocket :", err)
		return
	}

	// Récupérer le pageId depuis l'URL
	pageId := r.URL.Query().Get("pageId")
	if pageId == "" {
		log.Println("pageId manquant")
		conn.Close()
		return
	}

	client := &Client{
		conn: conn,
		send: make(chan []byte),
	}

	// S'assurer que le mutex pour ce fichier existe
	mux.Lock()
	if fileMux[pageId] == nil {
		fileMux[pageId] = &sync.Mutex{}
	}
	mux.Unlock()

	// Ajouter le client à la liste des éditeurs de cette page
	addClient(client, pageId)

	// Lancer une goroutine pour écrire les messages
	go writeMessages(client)

	// Envoyer l'historique du fichier au nouveau client
	sendHistoryToClient(client, pageId)

	// Lire les messages du client
	readMessages(client, pageId)
}

// Envoyer l'historique du fichier au client qui vient de se connecter
func sendHistoryToClient(client *Client, pageId string) {
	filePath := getFilePath(pageId)

	// Vérifier si le fichier existe
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return // Le fichier n'existe pas encore
	}

	fileMux[pageId].Lock()
	defer fileMux[pageId].Unlock()

	// Lire le contenu du fichier
	content, err := os.ReadFile(filePath)
	if err != nil {
		return
	}

	// Envoyer le contenu au client
	if len(content) > 0 {
		client.send <- content
	}
}

func readMessages(client *Client, pageId string) {
	defer func() {
		client.conn.Close()
		removeClient(client, pageId)
	}()

	for {
		_, msg, err := client.conn.ReadMessage()
		if err != nil {
			log.Println("Erreur de lecture :", err)
			break
		}

		// Sauvegarder le message dans un fichier
		saveMessageToFile(pageId, msg)

		// Diffuser le message aux autres clients
		broadcastMessage(pageId, msg)
	}
}

func writeMessages(client *Client) {
	defer client.conn.Close()

	for msg := range client.send {
		err := client.conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Println("Erreur d'écriture :", err)
			break
		}
	}
}

// Ajouter un client à une page
func addClient(client *Client, pageId string) {
	mux.Lock()
	defer mux.Unlock()

	if pageEditors[pageId] == nil {
		pageEditors[pageId] = make(map[*Client]bool)
	}
	pageEditors[pageId][client] = true
}

// Supprimer un client d'une page
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

// Diffuser un message à tous les clients sur une page
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

// Sauvegarder un message dans un fichier
func saveMessageToFile(pageId string, msg []byte) {
	// Obtenir le mutex spécifique au fichier
	mux.Lock()
	mutex := fileMux[pageId]
	mux.Unlock()

	// Verrouiller l'accès au fichier
	mutex.Lock()
	defer mutex.Unlock()

	// Créer le dossier s'il n'existe pas
	if err := os.MkdirAll(storageDir, 0755); err != nil {
		log.Println("Erreur lors de la création du répertoire:", err)
		return
	}

	// Chemin du fichier
	filePath := getFilePath(pageId)

	// Écrire dans le fichier
	if err := os.WriteFile(filePath, msg, 0644); err != nil {
		log.Println("Erreur lors de l'écriture dans le fichier:", err)
	}
}

// Obtenir le chemin du fichier pour un pageId
func getFilePath(pageId string) string {
	return filepath.Join(storageDir, fmt.Sprintf("%s.txt", pageId))
}

func main() {
	// Définir le flag pour le port
	portPtr := flag.String("port", "8080", "port sur lequel le serveur va écouter")

	// Parser les flags de la ligne de commande
	flag.Parse()

	// Créer le répertoire de stockage s'il n'existe pas
	if err := os.MkdirAll(storageDir, 0755); err != nil {
		log.Fatalf("Erreur lors de la création du répertoire de stockage: %v", err)
	}

	http.HandleFunc("/ws", handleWebSocket)

	port := ":" + *portPtr
	fmt.Println("Serveur en écoute sur", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
