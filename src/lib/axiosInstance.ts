import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import logger from "./logger";

// Get API URL from environment variable
// This should be set via NEXT_PUBLIC_API_URL in .env.local
// Example: NEXT_PUBLIC_API_URL=http://localhost:5000/api (development)
//          NEXT_PUBLIC_API_URL=https://nubian-lne4.onrender.com/api (production)
let apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Normalize API URL - ensure it ends with /api
if (apiUrl) {
  // Remove trailing slash if present
  apiUrl = apiUrl.replace(/\/$/, '');
  // Add /api if not already present
  if (!apiUrl.endsWith('/api')) {
    apiUrl = `${apiUrl}/api`;
  }
}

// Validate API URL is set (envValidator also checks this, but this provides immediate feedback)
if (!apiUrl) {
    const errorMessage = 'NEXT_PUBLIC_API_URL environment variable is not set. Please configure it in your .env.local file.';
    logger.error('API Configuration Error', { error: errorMessage });
    // Don't throw during module load to avoid breaking the build
    // The envValidator will catch this during startup
}

export const axiosInstance = axios.create({
    baseURL: apiUrl || '', // Fallback to empty string if not set (will cause requests to fail, which is expected)
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
            const fullUrl = `${config.baseURL}${config.url}`;
            logger.debug('API Request', {
                method: config.method?.toUpperCase(),
                url: config.url,
                baseURL: config.baseURL,
                fullUrl: fullUrl,
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
            const fullUrl = error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown';
            logger.error('Network error - No response received', {
                url: error.config?.url,
                baseURL: error.config?.baseURL,
                fullUrl: fullUrl,
                code: error.code,
                suggestion: !apiUrl 
                    ? 'NEXT_PUBLIC_API_URL is not set in .env.local'
                    : 'Check if the backend server is running and accessible',
            });
        } else {
            // Something else happened
            logger.error('Request setup error', { error: error.message });
        }

        return Promise.reject(error);
    }
);