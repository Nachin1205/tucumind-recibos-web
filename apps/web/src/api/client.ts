import axios from 'axios';

const configuredBaseURL = import.meta.env.VITE_API_URL;
const defaultBaseURL = import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1';
const baseURL = (configuredBaseURL || defaultBaseURL).replace(/\/$/, '');

const api = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = String(error.config?.url || '');
        const isLoginRequest = requestUrl.includes('/auth/login');

        if (error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
