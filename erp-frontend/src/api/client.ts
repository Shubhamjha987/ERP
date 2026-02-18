import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ---- REQUEST INTERCEPTOR: Attach JWT ----
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("erp_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---- RESPONSE INTERCEPTOR: Handle errors / auto-logout ----
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("erp_token");
      localStorage.removeItem("erp_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default apiClient;
