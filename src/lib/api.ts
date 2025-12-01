import { supabase } from './supabase';

/**
 * Make an authenticated API request to the backend
 * Automatically includes the Supabase auth token in headers
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const headers = new Headers(options.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Could not connect to the server. Please check if the backend is running.');
    }
    throw error;
  }
}

