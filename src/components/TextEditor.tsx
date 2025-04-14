import React, { useState, useEffect } from "react";
import config from "../config/config";

interface TextEditorProps {
  pageId: string; // Parameter to identify the note
}

const TextEditor: React.FC<TextEditorProps> = ({ pageId }) => {
  const [text, setText] = useState<string>(""); // Editor content
  const [ws, setWs] = useState<WebSocket | null>(null); // WebSocket instance

  // Function to handle changes in the text area
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Send changes to WebSocket server
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(newText);
    }
  };

  useEffect(() => {
    // Initialize WebSocket connection with the server
    const socket = new WebSocket(`${config.wsUrl}?pageId=${pageId}`);
    setWs(socket);

    // Actions when WebSocket connection opens
    socket.onopen = () => {
    };

    // Actions when receiving messages from the server
    socket.onmessage = (event) => {
      const receivedText = event.data;
      setText(receivedText); // Load/update the received text
    };

    // Actions when the connection closes
    socket.onclose = () => {
    };

    // Cleanup when the component unmounts (closing WebSocket connection)
    return () => {
      socket.close();
    };
  }, [pageId]);

  // Generate line numbers for the editor
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
