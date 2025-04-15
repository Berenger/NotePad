import React, { useState, useEffect, useRef, useCallback } from "react";
import config from "../config/config";

interface TextEditorProps {
  pageId: string; // Parameter to identify the note
}

const TextEditor: React.FC<TextEditorProps> = ({ pageId }) => {
  const [text, setText] = useState<string>(""); // Editor content
  const [ws, setWs] = useState<WebSocket | null>(null); // WebSocket instance
  const [connected, setConnected] = useState<boolean>(false); // Connection status
  const [reconnecting, setReconnecting] = useState<boolean>(false); // Reconnection status
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to create and initialize WebSocket connection
  const createWebSocketConnection = useCallback(() => {
    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const socket = new WebSocket(`${config.wsUrl}?pageId=${pageId}`);

    socket.onopen = () => {
      setConnected(true);
      setReconnecting(false);
      reconnectAttempts.current = 0;
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      const receivedText = event.data;
      setText(receivedText); // Load/update the received text
    };

    socket.onclose = (event) => {
      setConnected(false);

      // Don't attempt to reconnect if the closure was clean/intentional
      if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
        setReconnecting(true);

        // Exponential backoff for reconnection attempts
        const delay = Math.min(1000 * (2 ** reconnectAttempts.current), 30000);

        console.log(`WebSocket connection closed. Attempting to reconnect in ${delay / 1000}s...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          createWebSocketConnection();
        }, delay);
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        setReconnecting(false);
        console.error("Maximum reconnection attempts reached. Please refresh the page.");
      }
    };

    socket.onerror = () => {
      console.error("WebSocket encountered an error");
      // We don't set connected to false here because the onclose will be triggered after an error
    };

    setWs(socket);

    return socket;
  }, [pageId]);

  // Function to handle changes in the text area
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Send changes to WebSocket server if connected
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(newText);
    }
  };

  // Manual reconnect function that users can trigger
  const handleManualReconnect = () => {
    if (ws) {
      ws.close();
    }
    reconnectAttempts.current = 0;
    createWebSocketConnection();
  };

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = createWebSocketConnection();

    // Cleanup when the component unmounts
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socket.close();
    };
  }, [createWebSocketConnection]);

  // Generate line numbers for the editor
  const getLineNumbers = () => {
    const lineCount = Math.max(text.split("\n").length, 42);
    return Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
  };


  return (
    <>
      {!connected && (
        <div className="Error-text">
          The communication channel is not open. The synchronization feature is unavailable.
          {!reconnecting && (<button className="Reconnection-button" onClick={handleManualReconnect}> Try Reconnection</button> )}
        </div>
      )}
      {reconnecting && (
        <div className="Error-text">
          Attempting to reconnect...
        </div>
      )}
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
    </>
  );
};

export default TextEditor;
