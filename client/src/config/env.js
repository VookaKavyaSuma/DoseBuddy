/**
 * DoseBuddy Frontend Centralized Environment Configuration
 */

const normalizeUrl = (url) => {
    return (url || '').trim().replace(/\/+$/, '');
};

const normalizeApiUrl = (url) => {
    const trimmed = normalizeUrl(url);
    if (!trimmed) {
        return 'http://localhost:8080/api';
    }
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const rawApiUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && (
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_BACKEND_URL ||
        import.meta.env.REACT_APP_BACKEND_URL
    )) ||
    (typeof process !== 'undefined' && process.env && (
        process.env.VITE_API_BASE_URL ||
        process.env.VITE_BACKEND_URL ||
        process.env.REACT_APP_BACKEND_URL
    )) ||
    'http://localhost:8080/api';

const rawFrontendUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && (
        import.meta.env.VITE_FRONTEND_URL ||
        import.meta.env.FRONTEND_URL
    )) ||
    'http://localhost:5173';

export const API_BASE_URL = normalizeApiUrl(rawApiUrl);
export const FRONTEND_URL = normalizeUrl(rawFrontendUrl) || 'http://localhost:5173';

// Backwards compatibility export
export const REACT_APP_BACKEND_URL = API_BASE_URL;

export default {
    API_BASE_URL,
    FRONTEND_URL,
    REACT_APP_BACKEND_URL,
};
