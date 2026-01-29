import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from '../constants/config';
import { ApiResponse } from '../types';

// Create Unified Axios Instance
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Inject Auth Token
apiClient.interceptors.request.use(
    (config) => {
        // TODO: Retrieve token from storage (e.g., AsyncStorage or LocalStorage)
        // const token = ...
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError<ApiResponse<any>>) => {
        let errorMessage = 'An unexpected error occurred';

        if (error.response) {
            // Server responded with a status code outside 2xx
            if (error.response.status === 401) {
                // Handle Unauthorized (e.g., redirect to login)
                console.warn('Unauthorized access');
            }
            errorMessage = error.response.data?.message || error.message;
        } else if (error.request) {
            // Request made but no response received
            errorMessage = 'Network Error: No response received';
        }

        // Return a standardized error object
        return Promise.reject({
            message: errorMessage,
            originalError: error,
        });
    }
);

export default apiClient;
