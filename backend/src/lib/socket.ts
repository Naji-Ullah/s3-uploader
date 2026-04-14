import { createServer } from "http";

import { Server } from "socket.io";

import { env } from "../config/env";
import { verifyAccessToken } from "../utils/jwt";

type HttpServer = ReturnType<typeof createServer>;

export function initSocketServer(httpServer: HttpServer): Server {
  const allowedOrigins = env.ALLOWED_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = typeof socket.handshake.auth.token === "string" ? socket.handshake.auth.token : undefined;

    if (!token) {
      next();
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

  io.on("connection", (socket) => {
    const name = socket.data.user?.name ?? "Guest";

    socket.emit("system:hello", {
      message: `Connected to realtime server as ${name}`
    });
  });

  return io;
}
