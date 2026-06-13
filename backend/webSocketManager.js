// webSocketManager.js
// Simple WebSocket manager that groups connections by userId and allows server‑side pushes.
// Used by ragService to emit DOCUMENT_PROGRESS events.

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Map of userId => Set of WebSocket connections
const userSockets = new Map();

/**
 * Initialise the WebSocket server.
 * @param {WebSocket.Server} wss - The ws server instance (already bound to HTTP server).
 */
function init(wss) {
  wss.on('connection', (ws, request) => {
    // Expect a query param ?token=JWT
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
        userId = decoded.id || decoded._id || decoded.userId;
      } catch (e) {
        console.warn('WebSocket connection with invalid token');
      }
    }
    // If we couldn't determine a user, close the socket.
    if (!userId) {
      ws.close(4001, 'Authentication required');
      return;
    }
    // Store socket
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(ws);
    ws.userId = userId;
    // Clean up on close
    ws.on('close', () => {
      const set = userSockets.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) userSockets.delete(userId);
      }
    });
    // Optional: handle ping/pong
    ws.on('error', (err) => console.error('WebSocket error', err));
  });
  console.log('WebSocket manager initialised');
}

/**
 * Send an event to all active sockets for a given user.
 * @param {string} userId - Mongo user _id.
 * @param {string} event - Custom event name (e.g., 'DOCUMENT_PROGRESS').
 * @param {object} payload - JSON‑serialisable data.
 */
function sendToUser(userId, event, payload) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const message = JSON.stringify({ event, payload });
  sockets.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
}

module.exports = { init, sendToUser };
