import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check for existing token
        const bootstrapAsync = async () => {
            let userToken;
            try {
                userToken = await AsyncStorage.getItem('token');
                // Ideally verify token with backend 'me' endpoint here
            } catch (e) {
                // Restoring token failed
            }
            // setUser(userToken); // Simplified logic
        };

        bootstrapAsync();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const data = await authService.login(email, password);
            await AsyncStorage.setItem('token', data.token);
            setUser(data.user);
            setIsLoading(false);
            return true;
        } catch (e) {
            setIsLoading(false);
            throw e;
        }
    };

    const register = async (name, email, password, phone, country, region, vehicleType, fuelType, registrationNumber) => {
        setIsLoading(true);
        try {
            const data = await authService.register(name, email, password, phone, country, region, vehicleType, fuelType, registrationNumber);
            await AsyncStorage.setItem('token', data.token);
            setUser(data.user);
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
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
