"use client";

import { useState, useEffect, useCallback } from "react";

const AUTH_STORAGE_KEY = "admin_auth";

export function useAdminAuth() {
  const [authHeader, setAuthHeader] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load auth from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      setAuthHeader(stored);
    }
    setIsReady(true);
  }, []);

  const getAuthHeader = useCallback((): string | null => {
    // Return cached header if available
    if (authHeader) return authHeader;

    // Prompt for credentials
    const username = prompt("Admin username:");
    if (!username) return null;

    const password = prompt("Admin password:");
    if (!password) return null;

    const header = "Basic " + btoa(`${username}:${password}`);
    setAuthHeader(header);
    sessionStorage.setItem(AUTH_STORAGE_KEY, header);
    return header;
  }, [authHeader]);

  const clearAuth = useCallback(() => {
    setAuthHeader(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  // Fetch wrapper that adds auth header automatically
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const header = authHeader || getAuthHeader();
      if (!header) {
        throw new Error("Authentication required");
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: header,
        },
      });

      // Clear auth on 401
      if (response.status === 401) {
        clearAuth();
      }

      return response;
    },
    [authHeader, getAuthHeader, clearAuth]
  );

  return {
    authHeader,
    getAuthHeader,
    clearAuth,
    authFetch,
    isReady,
  };
}
