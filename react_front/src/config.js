const config = {
    API_URL: process.env.NODE_ENV === 'production'
        ? window.location.origin
        : 'http://localhost:3000'
};

export default config;