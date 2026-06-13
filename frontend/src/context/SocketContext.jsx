import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef({});
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Function to register/subscribe to a WebSocket event
  const subscribe = (event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    listenersRef.current[event].push(callback);

    // Return unsubscribe function
    return () => {
      if (listenersRef.current[event]) {
        listenersRef.current[event] = listenersRef.current[event].filter((cb) => cb !== callback);
      }
    };
  };

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      setConnected(false);
      return;
    }

    const connect = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection established.');
        setConnected(true);
        setSocket(ws);
      };

      ws.onmessage = (message) => {
        try {
          const { event, payload } = JSON.parse(message.data);
          
          // Trigger all registered callbacks for this event
          if (listenersRef.current[event]) {
            listenersRef.current[event].forEach((callback) => callback(payload));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket connection closed: code=${event.code}, reason=${event.reason}`);
        setConnected(false);
        setSocket(null);

        // Attempt reconnection after 3 seconds if not intentionally closed by logout
        if (event.code !== 4001 && event.code !== 4002 && user) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket connection error:', error);
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user]); // Re-bind connection only if user context updates

  return (
    <SocketContext.Provider value={{ socket, connected, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
