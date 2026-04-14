import axios, { InternalAxiosRequestConfig } from "axios";

import { ApiResponse, AuthPayload, StoredAuth } from "@/types/auth";

import { clearStoredAuth, getStoredAuth, setStoredAuth } from "./auth-storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

function isAuthRoute(url?: string): boolean {
  if (!url) {
    return false;
  }

  return ["/api/auth/login", "/api/auth/register", "/api/auth/refresh"].some((endpoint) =>
    url.includes(endpoint)
  );
}

let refreshRequest: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshRequest) {
    return refreshRequest;
  }

  const current = getStoredAuth();

  if (!current?.refreshToken) {
    clearStoredAuth();
    return null;
  }

  refreshRequest = axios
    .post<ApiResponse<AuthPayload>>(`${API_BASE_URL}/api/auth/refresh`, {
      refreshToken: current.refreshToken
    })
    .then((response) => {
      const data = response.data.data;
      const updated: StoredAuth = {
        user: data.user,
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken
      };

      setStoredAuth(updated);

      return updated.accessToken;
    })
    .catch(() => {
      clearStoredAuth();
      return null;
    })
    .finally(() => {
      refreshRequest = null;
    });

  return refreshRequest;
}

apiClient.interceptors.request.use((config) => {
  const auth = getStoredAuth();

  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const config = error.config as RetryableRequestConfig | undefined;

    if (!config || config._retry || error.response?.status !== 401 || isAuthRoute(config.url)) {
      return Promise.reject(error);
    }

    config._retry = true;

    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      return Promise.reject(error);
    }

    config.headers.Authorization = `Bearer ${newAccessToken}`;

    return apiClient(config);
  }
);
