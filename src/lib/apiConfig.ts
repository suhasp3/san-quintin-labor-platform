/**
 * API Configuration
 * Gets the backend API URL from environment variables
 * Falls back to localhost for local development
 */
export const getApiUrl = (): string => {
  try {
    // Check for environment variable first (for production)
    // Note: Vite only exposes env vars that start with VITE_
    const apiUrl = import.meta.env.VITE_API_URL;
    
    if (apiUrl && typeof apiUrl === 'string' && apiUrl.trim()) {
      const trimmedUrl = apiUrl.trim();
      // Ensure it has the protocol
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl;
      }
      // If no protocol, assume https for production
      return `https://${trimmedUrl}`;
    }
    
    // Fallback based on environment
    // In development (localhost), use localhost
    // In production (deployed), use production URL
    if (import.meta.env.DEV) {
      // Development mode - use localhost
      return 'http://localhost:8000';
    } else {
      // Production mode - use Railway URL
      return 'https://san-quintin-labor-platform-production.up.railway.app';
    }
  } catch (error) {
    console.error('Error getting API URL:', error);
    // Safe fallback
    return import.meta.env.DEV 
      ? 'http://localhost:8000' 
      : 'https://san-quintin-labor-platform-production.up.railway.app';
  }
};

// Initialize API_URL safely
let API_URL: string;
try {
  API_URL = getApiUrl();
} catch (error) {
  console.error('Failed to initialize API_URL:', error);
  // Ultimate fallback
  API_URL = import.meta.env.DEV 
    ? 'http://localhost:8000' 
    : 'https://san-quintin-labor-platform-production.up.railway.app';
}

export { API_URL };

