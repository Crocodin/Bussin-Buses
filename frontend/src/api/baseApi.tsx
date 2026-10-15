import axiom from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const IMAGES_BASE_URL = API_BASE_URL

const api = axiom.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export { api, IMAGES_BASE_URL }