interface Config {
    wsUrl: string;
    environment: string;
}

const config: Config = {
    wsUrl: process.env.REACT_APP_WS_URL!,
    environment: process.env.NODE_ENV!
};

export default config;