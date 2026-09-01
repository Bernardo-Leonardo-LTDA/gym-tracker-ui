import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: attach stored userId / auth if needed in future
// api.interceptors.request.use((config) => { ... return config; });
