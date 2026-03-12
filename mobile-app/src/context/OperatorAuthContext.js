import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { operatorAuthService } from '../services/operatorApi';

export const OperatorAuthContext = createContext();

export const OperatorAuthProvider = ({ children }) => {
    const [operator, setOperator] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing operator token
        const bootstrapAsync = async () => {
            try {
                const operatorData = await AsyncStorage.getItem('operator_user');
                const token = await AsyncStorage.getItem('operator_token');
                if (operatorData && token) {
                    setOperator(JSON.parse(operatorData));
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
            const data = await operatorAuthService.login(email, password);
            if (data.user.role !== 'OPERATOR') {
                throw new Error('Access denied. Operator role required.');
            }
            await AsyncStorage.setItem('operator_token', data.token);
            await AsyncStorage.setItem('operator_user', JSON.stringify(data.user));
            setOperator(data.user);
            setIsLoading(false);
            return true;
        } catch (e) {
            setIsLoading(false);
            throw e;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('operator_token');
        await AsyncStorage.removeItem('operator_user');
        setOperator(null);
    };

    return (
        <OperatorAuthContext.Provider value={{ operator, isLoading, login, logout }}>
            {children}
        </OperatorAuthContext.Provider>
    );
};
