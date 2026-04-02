// src/socket.js
import { io } from "socket.io-client";

// The URL where your Node.js backend is running
const SOCKET_URL = "http://localhost:8000";

// We initialize the socket with autoConnect false 
// so we can control exactly when it connects
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Helper functions for common game actions
export const socketEvents = {
  // Request to join the current round
  placeBet: (amount) => {
    socket.emit("place_bet", { amount });
  },

  // Request to cash out at the current multiplier
  requestCashout: () => {
    socket.emit("request_cashout");
  },
};