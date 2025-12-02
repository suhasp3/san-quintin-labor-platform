/**
 * API Configuration
 * Gets the backend API URL from environment variables
 * Falls back to localhost for local development
 */
export const getApiUrl = (): string => {
  // Check for environment variable first (for production)
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    // Ensure it has the protocol
    if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
      return apiUrl;
    }
    // If no protocol, assume https for production
    return `https://${apiUrl}`;
  }
  
  // Fallback to localhost for local development
  return 'http://localhost:8000';
};

export const API_URL = getApiUrl();

