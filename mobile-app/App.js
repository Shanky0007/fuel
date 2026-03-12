import React, { useContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

// User imports
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import StationListScreen from './src/screens/StationListScreen';
import StationDetailsScreen from './src/screens/StationDetailsScreen';
import TicketScreen from './src/screens/TicketScreen';

// Operator imports
import { OperatorAuthContext, OperatorAuthProvider } from './src/context/OperatorAuthContext';
import OperatorLoginScreen from './src/screens/operator/OperatorLoginScreen';
import OperatorDashboardScreen from './src/screens/operator/OperatorDashboardScreen';

// Role selection
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';

import { darkTheme } from './src/theme/darkTheme';

const Stack = createStackNavigator();

// User Navigation
function UserAuth() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="StationList" component={StationListScreen} />
            <Stack.Screen name="StationDetails" component={StationDetailsScreen} />
            <Stack.Screen name="Ticket" component={TicketScreen} />
        </Stack.Navigator>
    );
}

function UserNavigator({ onBack }) {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkTheme.colors.background }}>
                <ActivityIndicator size="large" color={darkTheme.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? <UserAuth /> : (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Login">
                        {(props) => <LoginScreen {...props} onBack={onBack} />}
                    </Stack.Screen>
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </Stack.Navigator>
            )}
        </NavigationContainer>
    );
}

// Operator Navigation
function OperatorNavigator({ onBack }) {
    const { operator, isLoading } = useContext(OperatorAuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkTheme.colors.background }}>
                <ActivityIndicator size="large" color={darkTheme.colors.success} />
            </View>
        );
    }

    if (!operator) {
        return <OperatorLoginScreen onBack={onBack} />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="OperatorDashboard" component={OperatorDashboardScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// Main App with Role Selection
function AppContent() {
    const [selectedRole, setSelectedRole] = useState(null);
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        // Check if there's a saved role
        const checkSavedRole = async () => {
            try {
                // Don't auto-restore role - always show role selection on app start
                // This gives users the flexibility to switch roles
            } catch (e) {
                console.error('Failed to check saved role:', e);
            } finally {
                setCheckingRole(false);
            }
        };
        checkSavedRole();
    }, []);

    const handleSelectRole = async (role) => {
        setSelectedRole(role);
        await AsyncStorage.setItem('selected_role', role);
    };

    const handleBackToRoleSelection = async () => {
        setSelectedRole(null);
        await AsyncStorage.removeItem('selected_role');
    };

    if (checkingRole) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkTheme.colors.background }}>
                <ActivityIndicator size="large" color={darkTheme.colors.primary} />
            </View>
        );
    }

    if (!selectedRole) {
        return <RoleSelectionScreen onSelectRole={handleSelectRole} />;
    }

    switch (selectedRole) {
        case 'operator':
            return (
                <OperatorAuthProvider>
                    <OperatorNavigator onBack={handleBackToRoleSelection} />
                </OperatorAuthProvider>
            );
        case 'user':
        default:
            return (
                <AuthProvider>
                    <UserNavigator onBack={handleBackToRoleSelection} />
                </AuthProvider>
            );
    }
}

export default function App() {
    return <AppContent />;
}
