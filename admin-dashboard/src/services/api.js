import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://fuel-backend-175700686095.asia-south1.run.app/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

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

export const stationService = {
  getAll: async () => {
    const response = await api.get("/stations");
    return Array.isArray(response.data) ? response.data : [];
  },
  getQueue: async (stationId) => {
    const response = await api.get(`/stations/${stationId}/queue`);
    return response.data;
  },
  create: async (stationData) => {
    const response = await api.post("/admin/stations", stationData);
    return response.data;
  },
  update: async (id, stationData) => {
    const response = await api.put(`/admin/stations/${id}`, stationData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/admin/stations/${id}`);
    return response.data;
  },
};

export const operatorService = {
  getAll: async () => {
    const response = await api.get("/admin/operators");
    return Array.isArray(response.data) ? response.data : [];
  },
  create: async (operatorData) => {
    const response = await api.post("/admin/operators", operatorData);
    return response.data;
  },
  assignRegion: async (operatorId, region) => {
    const response = await api.post("/admin/operators/assign-region", {
      operatorId,
      region,
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/admin/operators/${id}`);
    return response.data;
  },
};

export const lookupService = {
  getFuelTypes: async () => {
    const response = await api.get("/admin/fuel-types");
    return Array.isArray(response.data) ? response.data : [];
  },
  getLocations: async () => {
    const response = await api.get("/admin/locations");
    return Array.isArray(response.data) ? response.data : [];
  },
  getCitiesForRegion: async (regionId) => {
    const response = await api.get(`/locations/regions/${regionId}/cities`);
    return Array.isArray(response.data) ? response.data : [];
  },
};

export const queueAdminService = {
  getLiveQueues: async () => {
    const response = await api.get("/admin/queues");
    return Array.isArray(response.data) ? response.data : [];
  },
};

export const analyticsService = {
  getOverview: async () => {
    try {
      const response = await api.get("/admin/analytics");
      const data = response.data;
      return {
        totalStations: data.summary?.totalStations || 0,
        activeQueues: data.summary?.activeQueues || 0,
        todayServiced: data.summary?.completedQueues || 0,
        avgWaitTime: 15, // This could be calculated from queue data
      };
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      return {
        totalStations: 0,
        activeQueues: 0,
        todayServiced: 0,
        avgWaitTime: 0,
      };
    }
  },
  getTrafficData: async () => {
    // This would require additional backend implementation for real traffic data
    // For now, return sample data structure
    return [
      { hour: "6 AM", vehicles: 0 },
      { hour: "9 AM", vehicles: 0 },
      { hour: "12 PM", vehicles: 0 },
      { hour: "3 PM", vehicles: 0 },
      { hour: "6 PM", vehicles: 0 },
      { hour: "9 PM", vehicles: 0 },
    ];
  },
  getFuelDistribution: async () => {
    // This would require additional backend implementation
    return [
      { name: "Petrol", value: 45 },
      { name: "Diesel", value: 35 },
      { name: "EV", value: 10 },
      { name: "CNG", value: 10 },
    ];
  },
};

export const fuelQuotaService = {
  getAll: async () => {
    const response = await api.get("/admin/fuel-quotas");
    return Array.isArray(response.data) ? response.data : [];
  },
  update: async (vehicleType, weeklyLimit) => {
    const response = await api.put("/admin/fuel-quotas", {
      vehicleType,
      weeklyLimit,
    });
    return response.data;
  },
  getVehicleConsumption: async (registrationNumber) => {
    const response = await api.get(`/admin/fuel-consumption/${registrationNumber}`);
    return response.data;
  },
};

export default api;
