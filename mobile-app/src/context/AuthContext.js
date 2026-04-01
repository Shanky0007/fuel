import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check for existing token and fetch user data
        const bootstrapAsync = async () => {
            try {
                const userToken = await AsyncStorage.getItem('token');
                if (userToken) {
                    // Fetch user data from backend
                    const userData = await authService.getMe();
                    setUser(userData);
                }
            } catch (e) {
                console.error('Failed to restore session:', e);
                // Clear invalid token
                await AsyncStorage.removeItem('token');
            }
        };

        bootstrapAsync();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const data = await authService.login(email, password);
            await AsyncStorage.setItem('token', data.token);
            
            // Fetch complete user profile
            const fullUser = await authService.getMe();
            setUser(fullUser);
            setIsLoading(false);
            return true;
        } catch (e) {
            setIsLoading(false);
            throw e;
        }
    };

    const register = async (name, email, password, phone, country, region, city, vehicleType, fuelType, registrationNumber) => {
        setIsLoading(true);
        try {
            const data = await authService.register(name, email, password, phone, country, region, city, vehicleType, fuelType, registrationNumber);
            await AsyncStorage.setItem('token', data.token);
            
            // Fetch complete user profile
            const fullUser = await authService.getMe();
            setUser(fullUser);
            setIsLoading(false);
            return true;
        } catch (e) {
            setIsLoading(false);
            throw e;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
