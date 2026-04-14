import { ApiResponse, AuthPayload, DashboardData } from "@/types/auth";

import { clearStoredAuth, setStoredAuth } from "./auth-storage";
import { apiClient } from "./api-client";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export async function registerRequest(payload: RegisterRequest): Promise<void> {
  await apiClient.post<ApiResponse<AuthPayload>>("/api/auth/register", payload);
}

export async function loginRequest(payload: LoginRequest): Promise<AuthPayload> {
  const response = await apiClient.post<ApiResponse<AuthPayload>>("/api/auth/login", payload);
  const authPayload = response.data.data;

  setStoredAuth({
    user: authPayload.user,
    accessToken: authPayload.tokens.accessToken,
    refreshToken: authPayload.tokens.refreshToken
  });

  return authPayload;
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiClient.post("/api/auth/logout");
  } finally {
    clearStoredAuth();
  }
}

export async function fetchDashboardMessage(): Promise<DashboardData> {
  const response = await apiClient.get<ApiResponse<DashboardData>>("/api/dashboard");
  return response.data.data;
}
