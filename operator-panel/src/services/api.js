import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://2dc0-2401-4900-892e-5a3-5cf8-ec30-49ec-dcd0.ngrok-free.app/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
};

export const ticketService = {
  verify: async (qrCodeData) => {
    const response = await api.post("/tickets/verify", { qrCodeData });
    return response.data;
  },
  verifyByCode: async (verificationCode) => {
    const response = await api.post("/tickets/verify", { verificationCode });
    return response.data;
  },
  complete: async (queueId, fuelAmount) => {
    const response = await api.post("/tickets/complete", {
      queueId,
      fuelAmount,
    });
    return response.data;
  },
};

export const stationService = {
  getQueue: async (stationId) => {
    const response = await api.get(`/stations/${stationId}/queue`);
    return response.data;
  },
};

export const operatorService = {
  getRegionalQueues: async () => {
    const response = await api.get("/operator/queues");
    return response.data;
  },
  getRegionalStations: async () => {
    const response = await api.get("/operator/stations");
    return response.data;
  },
};

export default api;
