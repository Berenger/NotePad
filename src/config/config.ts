/**
 * Configuration interface for application settings
 * Defines the structure for the configuration object with WebSocket URL and environment
 */
interface Config {
    wsUrl: string;     // URL for WebSocket connections
    environment: string;  // Current environment (development, production, etc.)
}

/**
 * Application configuration object
 * Retrieves values from environment variables
 * - wsUrl: WebSocket server address from REACT_APP_WS_URL
 * - environment: Current Node environment from NODE_ENV
 * Non-null assertion (!) used to assure TypeScript these values exist
 */
const config: Config = {
    wsUrl: process.env.REACT_APP_WS_URL!,
    environment: process.env.NODE_ENV!
};

export default config;