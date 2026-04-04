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

// Auth Service
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
    city,
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
      city,
      vehicleType,
      fuelType,
      registrationNumber,
    });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },
  updateLocation: async (country, region) => {
    const response = await api.patch("/auth/profile/location", { country, region });
    return response.data;
  },
  updateVehicle: async (vehicleType, fuelType) => {
    const response = await api.patch("/auth/profile/vehicle", { vehicleType, fuelType });
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },
  resetPassword: async (token, newPassword) => {
    const response = await api.post("/auth/reset-password", { token, newPassword });
    return response.data;
  },
  getMyStats: async () => {
    const response = await api.get("/auth/me/stats");
    return response.data;
  },
};

// Station Service
export const stationService = {
  getAll: async () => {
    const response = await api.get("/stations");
    return response.data;
  },
  getByUserLocation: async (userId) => {
    const response = await api.get(`/stations?userId=${userId}`);
    return response.data;
  },
  getById: async (id, userId) => {
    const response = await api.get(`/stations/${id}?userId=${userId}`);
    return response.data;
  },
  getStationQueue: async (stationId) => {
    const response = await api.get(`/stations/${stationId}/queue`);
    return response.data;
  },
};

// Queue Service
export const queueService = {
  joinQueue: async (data) => {
    const response = await api.post("/queue/join", data);
    return response.data;
  },
  getMyQueue: async () => {
    const response = await api.get("/queue/status");
    return response.data;
  },
  getStationQueue: async (stationId) => {
    const response = await api.get(`/stations/${stationId}/queue`);
    return response.data;
  },
  leaveQueue: async () => {
    const response = await api.post("/queue/cancel");
    return response.data;
  },
};

// Vehicle Service
export const vehicleService = {
  getAll: async () => {
    const response = await api.get("/vehicles");
    return response.data;
  },
  create: async (data) => {
    const response = await api.post("/vehicles", data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },
  getFuelTypes: async () => {
    const response = await api.get("/vehicles/fuel-types");
    return response.data;
  },
};

// Location Service
export const lookupService = {
  getCountries: async () => {
    const response = await api.get("/locations/countries");
    return Array.isArray(response.data) ? response.data : [];
  },
  getLocations: async () => {
    const response = await api.get("/locations/countries");
    return Array.isArray(response.data) ? response.data : [];
  },
  getCountryById: async (countryId) => {
    const response = await api.get(`/locations/countries/${countryId}`);
    return response.data;
  },
  getRegionsByCountry: async (countryId) => {
    const response = await api.get(`/locations/countries/${countryId}/regions`);
    return Array.isArray(response.data) ? response.data : [];
  },
  getCitiesByRegion: async (regionId) => {
    const response = await api.get(`/locations/regions/${regionId}/cities`);
    return Array.isArray(response.data) ? response.data : [];
  },
  validateLocation: async (country, region) => {
    const response = await api.post("/locations/validate", { country, region });
    return response.data;
  },
};
