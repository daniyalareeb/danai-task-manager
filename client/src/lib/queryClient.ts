/**
 * React Query Configuration & API Client
 * 
 * This module handles:
 * - API request configuration with timeouts and retries
 * - Capacitor HTTP integration for mobile apps (bypasses mixed content restrictions)
 * - Dynamic API base URL resolution (dev server vs production)
 * - Query client setup with retry logic for server sleep scenarios
 * 
 * Key Features:
 * - 60-second timeouts (handles Render free tier ~50s wake-up time)
 * - Retry logic with delays (queries: 1 retry @ 2s, mutations: 2 retries @ 5s)
 * - Automatic Capacitor detection for mobile environment
 */

import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { CapacitorHttp } from "@capacitor/core";

/**
 * Detects if the app is running in a Capacitor environment (mobile app)
 * @returns true if Capacitor is available, false otherwise
 */
function isCapacitor(): boolean {
  return typeof window !== "undefined" && window.Capacitor !== undefined;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Capacitor HTTP wrapper that mimics fetch Response
// This bypasses mixed content restrictions in Capacitor WebView
async function capacitorFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  try {
    // Convert headers object to Record<string, string>
    const headers: Record<string, string> = {};
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    // Parse body if it's a JSON string
    let data: any = undefined;
    if (options.body) {
      if (typeof options.body === "string") {
        try {
          data = JSON.parse(options.body);
        } catch {
          // If not JSON, keep as string (though CapacitorHttp expects object)
          data = options.body;
        }
      } else {
        data = options.body;
      }
    }

    // Make request with CapacitorHttp
    const response = await CapacitorHttp.request({
      url,
      method: (options.method as any) || "GET",
      headers,
      data,
    });

    // Convert CapacitorHttp response to fetch-like Response
    // CapacitorHttp returns: { data: any, status: number, headers: Record<string, string> }
    const responseBody = response.data ? JSON.stringify(response.data) : "";
    const responseHeaders = new Headers();
    if (response.headers) {
      Object.entries(response.headers).forEach(([key, value]) => {
        responseHeaders.set(key, String(value));
      });
    }

    return new Response(responseBody, {
      status: response.status || 200,
      statusText: response.statusText || "",
      headers: responseHeaders,
    });
  } catch (error: any) {
    // Convert CapacitorHttp errors to fetch-like errors
    if (error.message) {
      throw new Error(error.message);
    }
    throw error;
  }
}

/**
 * Determines the API base URL based on the environment
 * 
 * In Capacitor (mobile app):
 * - Uses the development server IP (for local testing)
 * - Or uses the configured server URL from Capacitor config
 * 
 * In web browser:
 * - Uses relative URLs (empty string) which works for both dev and production
 * 
 * @returns The base URL for API requests (empty string for relative URLs)
 */
function getApiBaseUrl(): string {
  // Check if we're in Capacitor environment
  if (typeof window !== 'undefined' && window.Capacitor) {
    // In Capacitor, we need to use the actual server URL for API calls
    // even though the app UI is served from local files
    // Try to get server URL from Capacitor config first
    const config = (window as any).Capacitor?.getConfig?.();
    if (config?.server?.url) {
      return config.server.url;
    }
    
    // If not in config, use the production Render deployment URL
    // For local development, uncomment the line below and use your local IP
    // return 'http://192.168.1.243:5000';
    return 'https://danai-task-manager.onrender.com';
  }
  
  // For web browser, use relative URLs (will use current origin)
  // This allows the app to work in both development and production web builds
  return '';
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const fullUrl = baseUrl + url;
  
  // Use CapacitorHttp in Capacitor environment to bypass mixed content restrictions
  if (isCapacitor()) {
    try {
      // Add timeout using Promise.race for Capacitor
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out. Please check your connection.")), 60000);
      });

      const requestPromise = capacitorFetch(fullUrl, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
      });

      const res = await Promise.race([requestPromise, timeoutPromise]);
      await throwIfResNotOk(res);
      return res;
    } catch (error: any) {
      // Log error for debugging
      console.error("API request failed:", { method, url: fullUrl, error: error.message });
      throw error;
    }
  }

  // Use browser fetch for web environment
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
      mode: "cors",
    });

    clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }
    // Log error for debugging
    console.error("API request failed:", { method, url: fullUrl, error: error.message });
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiBaseUrl();
    const url = baseUrl + queryKey.join("/");
    
    // Use CapacitorHttp in Capacitor environment to bypass mixed content restrictions
    if (isCapacitor()) {
      try {
        // Add timeout using Promise.race for Capacitor
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Request timed out. Server may be unreachable.")), 60000);
        });

        const requestPromise = capacitorFetch(url, {
          method: "GET",
          headers: {},
        });

        const res = await Promise.race([requestPromise, timeoutPromise]);

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        await throwIfResNotOk(res);
        return await res.json();
      } catch (error: any) {
        // Log error for debugging
        console.error("Query failed:", { url, error: error.message });
        throw error;
      }
    }

    // Use browser fetch for web environment
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for queries
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        signal: controller.signal,
        mode: "cors", // Enable CORS for cross-origin requests
      });

      clearTimeout(timeoutId);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Request timed out. Server may be unreachable.");
      }
      // Log error for debugging
      console.error("Query failed:", { url, error: error.message });
      throw error;
    }
  };

/**
 * React Query Client Configuration
 * 
 * Optimized for Render free tier server sleep behavior:
 * - Queries: 1 retry with 2s delay (handles transient failures)
 * - Mutations: 2 retries with 5s delay (handles server wake-up)
 * - 60-second timeouts (covers ~50s Render wake-up time)
 * - Refetch on window focus for fresh data
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable refetch on window focus
      staleTime: 30000, // 30 seconds - allows refetching when needed
      retry: 1, // Allow one retry on failure
      retryDelay: 2000, // 2 second delay between retries
      refetchOnMount: true, // Refetch when component mounts
    },
    mutations: {
      retry: 2, // Retry twice with delays (handles server sleep)
      retryDelay: 5000, // 5 second delay between retries
    },
  },
});
