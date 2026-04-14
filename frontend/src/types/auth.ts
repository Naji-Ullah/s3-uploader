export interface ApiResponse<TData> {
  success: boolean;
  message: string;
  data: TData;
  code?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface AuthPayload {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface StoredAuth {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface DashboardData {
  message: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
}
