//Socket.js
import { io } from "socket.io-client";

const ports = [3000, 3001, 3002, 3003, 3004];
const multiport = ports[Math.floor(Math.random() * ports.length)];

export const socket = io(`http://localhost:${multiport}`, {
  auth: { 
  serverOffset: null
},
});
