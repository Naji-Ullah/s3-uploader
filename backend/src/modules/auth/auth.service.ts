import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { comparePassword, hashPassword } from "../../utils/password";
import { AuthResponse, AuthTokens, LoginInput, RegisterInput } from "./auth.types";

interface AuthUserRecord {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  passwordHash: string;
  refreshTokenHash: string | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toPublicUser(user: Pick<AuthUserRecord, "id" | "name" | "email" | "createdAt">): AuthResponse["user"] {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString()
  };
}

async function issueTokens(user: Pick<AuthUserRecord, "id" | "name" | "email">): Promise<AuthTokens> {
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    name: user.name
  });

  const refreshToken = signRefreshToken(user.id);
  const refreshTokenHash = await hashPassword(refreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash }
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshTokenExpiresIn: env.JWT_REFRESH_EXPIRES_IN
  };
}

async function findUserByEmail(email: string): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      passwordHash: true,
      refreshTokenHash: true
    }
  });
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const email = normalizeEmail(input.email);
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new AppError("Email is already in use", 409, "EMAIL_ALREADY_EXISTS");
  }

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash: await hashPassword(input.password)
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      passwordHash: true,
      refreshTokenHash: true
    }
  });

  const tokens = await issueTokens(user);

  return {
    user: toPublicUser(user),
    tokens
  };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const email = normalizeEmail(input.email);
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const tokens = await issueTokens(user);

  return {
    user: toPublicUser(user),
    tokens
  };
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const payload = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      passwordHash: true,
      refreshTokenHash: true
    }
  });

  if (!user || !user.refreshTokenHash) {
    throw new AppError("Refresh token is invalid", 401, "INVALID_REFRESH_TOKEN");
  }

  const isValid = await comparePassword(refreshToken, user.refreshTokenHash);

  if (!isValid) {
    throw new AppError("Refresh token is invalid", 401, "INVALID_REFRESH_TOKEN");
  }

  const tokens = await issueTokens(user);

  return {
    user: toPublicUser(user),
    tokens
  };
}

export async function logout(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null }
  });
}
