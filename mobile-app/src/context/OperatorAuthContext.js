import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { operatorAuthService } from '../services/operatorApi';

export const OperatorAuthContext = createContext();

export const OperatorAuthProvider = ({ children }) => {
    const [operator, setOperator] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing operator token and fetch operator data
        const bootstrapAsync = async () => {
            try {
                console.log('Checking for existing operator session...');
                const token = await AsyncStorage.getItem('operator_token');
                console.log('Found token:', token ? 'Yes' : 'No');
                
                if (token) {
                    // Fetch operator data from backend instead of AsyncStorage
                    try {
                        const userData = await operatorAuthService.getMe();
                        console.log('Restoring operator session:', userData.email);
                        setOperator(userData);
                    } catch (e) {
                        console.error('Failed to fetch operator data:', e);
                        // Clear invalid token
                        await AsyncStorage.removeItem('operator_token');
                        await AsyncStorage.removeItem('operator_user');
                    }
                } else {
                    console.log('No existing operator session found');
                }
            } catch (e) {
                console.error('Failed to restore operator session:', e);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            console.log('Attempting operator login with:', email);
            const data = await operatorAuthService.login(email, password);
            console.log('Login response:', data);
            
            if (data.user.role !== 'OPERATOR' && data.user.role !== 'ADMIN') {
                throw new Error('Access denied. Operator role required.');
            }
            
            console.log('Storing operator token...');
            await AsyncStorage.setItem('operator_token', data.token);
            
            // Fetch complete operator profile
            const fullOperator = await operatorAuthService.getMe();
            console.log('Setting operator state...');
            setOperator(fullOperator);
            setIsLoading(false);
            console.log('Login successful! Operator state set:', fullOperator.email);
            return true;
        } catch (e) {
            console.error('Login error:', e);
            console.error('Error details:', e.response?.data || e.message);
            setIsLoading(false);
            throw e;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('operator_token');
        await AsyncStorage.removeItem('operator_user');
        if (Platform.OS === 'web') {
            try {
                localStorage.removeItem('operator_token');
                localStorage.removeItem('operator_user');
            } catch (e) {
                console.warn('Failed to clear localStorage:', e);
            }
        }
        setOperator(null);
    };

    return (
        <OperatorAuthContext.Provider value={{ operator, isLoading, login, logout }}>
            {children}
        </OperatorAuthContext.Provider>
    );
};
