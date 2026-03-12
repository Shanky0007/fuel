import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
  register: async (
    name,
    email,
    password,
    phone,
    country,
    region,
    vehicleType,
    fuelType,
    registrationNumber
  ) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
      phone,
      country,
      region,
      vehicleType,
      fuelType,
      registrationNumber,
    });
    return response.data;
  },
};

export const stationService = {
  getAll: async () => {
    // START_MOCK: Return mock data if backend not ready
    // return { data: [{ id: '1', name: 'Central Station', location: 'Downtown', status: 'OPEN', totalPumps: 8 }] };
    // END_MOCK
    return api.get("/stations");
  },
};

export const queueService = {
  join: async (stationId, vehicleId) => {
    return api.post("/queue/join", { stationId, vehicleId });
  },
  getStatus: async () => {
    return api.get("/queue/status");
  },
};
