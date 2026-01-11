// API Base URL - points to deployed backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface FetchOptions extends RequestInit {
    token?: string;
}

/**
 * Centralized API client for making requests to the backend
 * Automatically handles:
 * - Base URL configuration (localhost vs production)
 * - JSON content type headers
 * - Authorization headers
 * - Error detection for HTML responses
 */
export const apiClient = {
    /**
     * Make an API request
     * @param endpoint - API endpoint (e.g., '/api/auth/login')
     * @param options - Fetch options with optional token
     */
    async fetch(endpoint: string, options?: FetchOptions): Promise<Response> {
        const { token, ...fetchOptions } = options || {};

        const url = `${API_BASE_URL}${endpoint}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
        };

        // Add Authorization header if token provided
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...fetchOptions,
            headers,
        });

        // Check if server returned HTML instead of JSON (common deployment error)
        const contentType = response.headers.get('content-type');
        if (!response.ok && contentType?.includes('text/html')) {
            throw new Error('Server returned HTML instead of JSON. Backend may not be deployed correctly.');
        }

        return response;
    },

    /**
     * GET request helper
     */
    async get(endpoint: string, token?: string): Promise<Response> {
        return this.fetch(endpoint, { method: 'GET', token });
    },

    /**
     * POST request helper
     */
    async post(endpoint: string, data?: any, token?: string): Promise<Response> {
        return this.fetch(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
            token,
        });
    },

    /**
     * PUT request helper
     */
    async put(endpoint: string, data?: any, token?: string): Promise<Response> {
        return this.fetch(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
            token,
        });
    },

    /**
     * DELETE request helper
     */
    async delete(endpoint: string, token?: string): Promise<Response> {
        return this.fetch(endpoint, { method: 'DELETE', token });
    },
};
