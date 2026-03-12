import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('operator_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const operatorAuthService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
};

export const ticketService = {
    verify: async (qrCodeData) => {
        const response = await api.post('/tickets/verify', { qrCodeData });
        return response.data;
    },
    verifyByCode: async (verificationCode) => {
        const response = await api.post('/tickets/verify', { verificationCode });
        return response.data;
    },
    complete: async (queueId, fuelAmount) => {
        const response = await api.post('/tickets/complete', { queueId, fuelAmount });
        return response.data;
    },
};

export const operatorStationService = {
    getQueue: async (stationId) => {
        const response = await api.get(`/stations/${stationId}/queue`);
        return response.data;
    },
};

export const operatorQueueService = {
    getRegionalQueues: async () => {
        const response = await api.get('/operator/queues');
        return response.data;
    },
    getRegionalStations: async () => {
        const response = await api.get('/operator/stations');
        return response.data;
    },
};

export default api;
