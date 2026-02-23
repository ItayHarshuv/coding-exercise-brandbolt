import axios from "axios";

// Axios instance pre-configured to talk to the backend.
// In Docker, the Vite dev server proxies /api requests to the backend service.
// When running locally outside Docker, you can change the baseURL.
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
