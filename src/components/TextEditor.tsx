import React, { useState, useEffect } from "react";
import config from "../config/config";

interface TextEditorProps {
  pageId: string; // Paramètre pour identifier la note
}

const TextEditor: React.FC<TextEditorProps> = ({ pageId }) => {
  const [text, setText] = useState<string>(""); // Contenu de l'éditeur
  const [ws, setWs] = useState<WebSocket | null>(null); // Instance WebSocket

  // Fonction de gestion des changements dans la zone de texte
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Envoyer les modifications au serveur WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(newText);
    }
  };

  useEffect(() => {
    // Initialiser la connexion WebSocket avec le serveur
    const socket = new WebSocket(`${config.wsUrl}?pageId=${pageId}`);
    setWs(socket);

    // Actions lors de l'ouverture de la connexion WebSocket
    socket.onopen = () => {
    };

    // Actions lors de la réception de messages depuis le serveur
    socket.onmessage = (event) => {
      const receivedText = event.data;
      setText(receivedText); // Charger/mettre à jour le texte reçu
    };

    // Actions lors de la fermeture de la connexion
    socket.onclose = () => {
    };

    // Nettoyage à la fermeture du composant (fermeture de la connexion WebSocket)
    return () => {
      socket.close();
    };
  }, [pageId]);

  const getLineNumbers = () => {
    const lineCount = Math.max(text.split("\n").length, 42);
    return Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
  };

  return (
    <div className="Editor-container" style={{ display: "flex" }}>
      <div className="Line-numbers">
        <pre>{getLineNumbers()}</pre>
      </div>

      <textarea
        value={text}
        onChange={handleChange}
        className="Zone-text"
        placeholder="Start writing here..."
        rows={42}
      />
    </div>
  );
};

export default TextEditor;
