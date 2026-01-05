import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import logger from "./logger";

export const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
    timeout: 30000, // 30 seconds timeout
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Log request in development
        if (process.env.NODE_ENV === 'development') {
            logger.debug('API Request', {
                method: config.method?.toUpperCase(),
                url: config.url,
                baseURL: config.baseURL,
            });
        }
        return config;
    },
    (error) => {
        logger.error('Request error', { error: error.message });
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => {
        // Log successful responses in development
        if (process.env.NODE_ENV === 'development') {
            logger.debug('API Response', {
                status: response.status,
                url: response.config.url,
            });
        }
        return response;
    },
    (error: AxiosError) => {
        // Handle different error types
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const data = error.response.data as { message?: string; error?: { message?: string } };
            
            logger.error('API Error Response', {
                status,
                url: error.config?.url,
                message: data?.message || data?.error?.message || error.message,
            });

            // Handle specific error cases
            if (status === 401) {
                // Unauthorized - redirect to sign in
                if (typeof window !== 'undefined') {
                    window.location.href = '/sign-in';
                }
            } else if (status === 403) {
                // Forbidden
                logger.warn('Access forbidden', { url: error.config?.url });
            } else if (status >= 500) {
                // Server error
                logger.error('Server error', { status, url: error.config?.url });
            }
        } else if (error.request) {
            // Request was made but no response received
            logger.error('Network error - No response received', {
                url: error.config?.url,
            });
        } else {
            // Something else happened
            logger.error('Request setup error', { error: error.message });
        }

        return Promise.reject(error);
    }
);