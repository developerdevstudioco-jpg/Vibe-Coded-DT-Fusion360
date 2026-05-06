import axios from 'axios';

const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:8080';
const DEFAULT_PRODUCTION_API_BASE_URL = 'https://dtfusion360-backend.onrender.com';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const resolveApiBaseUrl = () => {
    const configuredBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL?.trim();

    if (configuredBaseUrl) {
        return trimTrailingSlash(configuredBaseUrl);
    }

    if (typeof window === 'undefined') {
        return DEFAULT_LOCAL_API_BASE_URL;
    }

    const { protocol, hostname } = window.location;

    if (protocol === 'file:') {
        return DEFAULT_LOCAL_API_BASE_URL;
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return DEFAULT_LOCAL_API_BASE_URL;
    }

    return DEFAULT_PRODUCTION_API_BASE_URL;
};

export const apiBaseUrl = resolveApiBaseUrl();

const axiosInstance = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            // Handle token refresh logic here
            return axiosInstance(originalRequest);
        }
        return Promise.reject(error);
    }
);




export default axiosInstance;
