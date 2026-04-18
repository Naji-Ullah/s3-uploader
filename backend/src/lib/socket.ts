import { createServer } from "http";

import { Namespace, Server, Socket } from "socket.io";

import { env } from "../config/env";
import { verifyAccessToken } from "../utils/jwt";
import { safeRedisDel, safeRedisExpire, safeRedisSAdd, safeRedisSRem, safeRedisSet } from "./redis";

type HttpServer = ReturnType<typeof createServer>;

interface SocketAuthUser {
  id: string;
  email: string;
  name: string;
}

export interface RealtimeDocumentPayload {
  documentId: string;
  userId: string;
  name: string;
  category: string | null;
  s3Url: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface RealtimeNotificationPayload {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface RealtimeCategoryPayload {
  id: string;
  name: string;
  color: string;
  action: "created";
}

const REALTIME_NAMESPACE_PATH = "/realtime";
const ONLINE_USERS_SET_KEY = "realtime:online-users";
const USER_SOCKET_SET_KEY_PREFIX = "realtime:user:sockets:";
const SOCKET_USER_KEY_PREFIX = "realtime:socket:user:";
const SOCKET_TTL_SECONDS = 60 * 60 * 12;

let realtimeNamespace: Namespace | null = null;
const localUserSockets = new Map<string, Set<string>>();

function resolveAllowedOrigins(): string[] {
  return env.ALLOWED_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getAccessToken(socket: Socket): string | null {
  if (typeof socket.handshake.auth.token === "string" && socket.handshake.auth.token.trim()) {
    return socket.handshake.auth.token.trim();
  }

  const header = socket.handshake.headers.authorization;

  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }

  return null;
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}

function getSocketDataUser(socket: Socket): SocketAuthUser | null {
  const value = socket.data.user as SocketAuthUser | undefined;
  return value ?? null;
}

function addSocketToLocalPresence(userId: string, socketId: string): boolean {
  const existing = localUserSockets.get(userId) ?? new Set<string>();
  const wasOffline = existing.size === 0;

  existing.add(socketId);
  localUserSockets.set(userId, existing);

  return wasOffline;
}

function removeSocketFromLocalPresence(userId: string, socketId: string): boolean {
  const existing = localUserSockets.get(userId);

  if (!existing) {
    return true;
  }

  existing.delete(socketId);

  if (existing.size === 0) {
    localUserSockets.delete(userId);
    return true;
  }

  localUserSockets.set(userId, existing);
  return false;
}

async function markUserOnline(userId: string, socketId: string): Promise<void> {
  const socketSetKey = `${USER_SOCKET_SET_KEY_PREFIX}${userId}`;
  const isFirstConnection = addSocketToLocalPresence(userId, socketId);

  await Promise.all([
    safeRedisSAdd(socketSetKey, socketId),
    safeRedisExpire(socketSetKey, SOCKET_TTL_SECONDS),
    safeRedisSet(`${SOCKET_USER_KEY_PREFIX}${socketId}`, userId, SOCKET_TTL_SECONDS)
  ]);

  if (isFirstConnection) {
    await safeRedisSAdd(ONLINE_USERS_SET_KEY, userId);
    realtimeNamespace?.emit("user:online", {
      userId,
      timestamp: new Date().toISOString()
    });
  }
}

async function markUserOffline(userId: string, socketId: string): Promise<void> {
  const socketSetKey = `${USER_SOCKET_SET_KEY_PREFIX}${userId}`;
  const isLastConnection = removeSocketFromLocalPresence(userId, socketId);

  await Promise.all([safeRedisSRem(socketSetKey, socketId), safeRedisDel(`${SOCKET_USER_KEY_PREFIX}${socketId}`)]);

  if (isLastConnection) {
    await safeRedisSRem(ONLINE_USERS_SET_KEY, userId);
    realtimeNamespace?.emit("user:offline", {
      userId,
      timestamp: new Date().toISOString()
    });
  }
}

function emitConnectionStatus(socket: Socket, status: "connected" | "disconnected" | "error"): void {
  socket.emit("connection:status", {
    status,
    timestamp: new Date().toISOString()
  });
}

function setupSocketConnectionHandlers(socket: Socket): void {
  const user = getSocketDataUser(socket);

  if (!user) {
    socket.emit("connection:status", {
      status: "error",
      message: "Socket user context missing"
    });
    socket.disconnect(true);
    return;
  }

  socket.join(userRoom(user.id));
  emitConnectionStatus(socket, "connected");

  void markUserOnline(user.id, socket.id);

  socket.on("disconnect", () => {
    void markUserOffline(user.id, socket.id);
  });

  socket.on("error", () => {
    emitConnectionStatus(socket, "error");
  });
}

export function initSocketServer(httpServer: HttpServer): Server {
  const allowedOrigins = resolveAllowedOrigins();

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  const namespace = io.of(REALTIME_NAMESPACE_PATH);
  realtimeNamespace = namespace;

  namespace.use((socket, next) => {
    const token = getAccessToken(socket);

    if (!token) {
      next(new Error("Unauthorized socket connection"));
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.user = {
        id: payload.userId,
        email: payload.email,
        name: payload.name
      };
      next();
    } catch {
      next(new Error("Unauthorized socket connection"));
    }
  });

  namespace.on("connection", (socket) => {
    setupSocketConnectionHandlers(socket);

    const user = getSocketDataUser(socket);

    socket.emit("system:hello", {
      message: `Connected to realtime server as ${user?.name ?? "Unknown"}`
    });
  });

  return io;
}

export function emitDocumentUploaded(payload: RealtimeDocumentPayload): void {
  if (!realtimeNamespace) {
    return;
  }

  realtimeNamespace.emit("document:uploaded", payload);
}

export function emitDocumentUpdated(payload: RealtimeDocumentPayload): void {
  if (!realtimeNamespace) {
    return;
  }

  realtimeNamespace.emit("document:updated", payload);
}

export function emitDocumentDeleted(payload: { documentId: string; userId: string; deletedAt: string }): void {
  if (!realtimeNamespace) {
    return;
  }

  realtimeNamespace.emit("document:deleted", payload);
}

export function emitNotification(payload: RealtimeNotificationPayload): void {
  if (!realtimeNamespace) {
    return;
  }

  realtimeNamespace.to(userRoom(payload.userId)).emit("notification:new", payload);
}

export function emitCategoryUpdated(payload: RealtimeCategoryPayload): void {
  if (!realtimeNamespace) {
    return;
  }

  realtimeNamespace.emit("category:updated", payload);
}

export function getRealtimeNamespacePath(): string {
  return REALTIME_NAMESPACE_PATH;
}
