export const API_BASE_URL = process.env.REACT_APP_API_URL || (
    process.env.NODE_ENV === 'production'
        ? 'https://diem-backend.onrender.com' // Fallback for production if env var missing
        : 'http://localhost:3001'
);
