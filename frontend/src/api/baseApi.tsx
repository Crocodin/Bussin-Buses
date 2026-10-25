import axiom from "axios";
import { TOKEN_KEY, UNAUTHORIZED_EVENT } from "../auth/storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const IMAGES_BASE_URL = API_BASE_URL

const api = axiom.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// if the server says 401 (expired or invalid token), log out
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url: string = error.config?.url ?? "";
    const isAuthCall = url.endsWith("/login") || url.endsWith("/register");
    if (error.response?.status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  }
);

export { api, IMAGES_BASE_URL }