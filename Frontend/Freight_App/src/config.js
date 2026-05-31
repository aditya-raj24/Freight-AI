// Centralized API and Socket server configuration for deployment.
// Automatically falls back to local development URLs if no VITE_API_URL env is set.
export const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "http://localhost:3000/api";

export const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
