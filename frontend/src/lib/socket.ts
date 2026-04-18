import { Socket, io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
const SOCKET_NAMESPACE = "/realtime";

let socket: Socket | null = null;

export function connectSocket(token?: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(`${SOCKET_URL}${SOCKET_NAMESPACE}`, {
    transports: ["websocket"],
    auth: token ? { token } : undefined,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
  });

  return socket;
}

export function disconnectSocket(): void {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
}
