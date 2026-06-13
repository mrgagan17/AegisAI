const jwt = require('jsonwebtoken');
const url = require('url');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_access_key_123456';

// Map of userId -> Set of WebSocket clients
const userConnections = new Map();

/**
 * Initialize WebSocket Server and handle connections
 * @param {import('ws').Server} wss - WebSocket server instance
 */
function init(wss) {
  wss.on('connection', (ws, req) => {
    try {
      // Parse parameters from query string
      const parsedUrl = url.parse(req.url, true);
      const token = parsedUrl.query.token;

      if (!token) {
        ws.close(4001, 'Unauthorized: Token is required');
        return;
      }

      // Verify JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        ws.close(4002, 'Unauthorized: Invalid token');
        return;
      }

      const userId = decoded.id;
      ws.userId = userId;

      // Register connection
      if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set());
      }
      userConnections.get(userId).add(ws);

      console.log(`WebSocket client connected for user: ${userId} (${userConnections.get(userId).size} active tabs)`);

      // Handle closing connection
      ws.on('close', () => {
        const userSockets = userConnections.get(userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) {
            userConnections.delete(userId);
          }
        }
        console.log(`WebSocket client disconnected for user: ${userId}`);
      });

      // Handle ping-pong to keep connection alive
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Server Error');
    }
  });

  // Keep-alive heartbeat interval (every 30 seconds)
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}

/**
 * Send an event message to a specific user across all their connected sockets
 * @param {string} userId - User ID
 * @param {string} event - Event type name
 * @param {object} data - Payload data
 */
function sendToUser(userId, event, data) {
  const userSockets = userConnections.get(userId.toString());
  if (!userSockets) return;

  const payload = JSON.stringify({ event, data });
  userSockets.forEach((ws) => {
    if (ws.readyState === 1) { // OPEN state
      ws.send(payload);
    }
  });
}

/**
 * Send an event message to admin users (e.g. dashboard statistics)
 * @param {string} event - Event type name
 * @param {object} data - Payload data
 */
function sendToAdmins(event, data) {
  // If we want to broadcast system-wide events to logged-in admins
  // In a full implementation, we could verify the user's role on connection
  // For now, we can iterate over all sets
  const payload = JSON.stringify({ event, data });
  for (const [userId, sockets] of userConnections.entries()) {
    sockets.forEach(ws => {
      // If the socket user role is admin (we can store role on connection)
      // To keep it simple, we can check a flag on the socket if we store it
      if (ws.role === 'admin' && ws.readyState === 1) {
        ws.send(payload);
      }
    });
  }
}

module.exports = {
  init,
  sendToUser,
  sendToAdmins
};
