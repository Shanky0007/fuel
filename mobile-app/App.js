import React, { useContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, Platform } from 'react-native';

// User imports
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import StationListScreen from './src/screens/StationListScreen';
import StationDetailsScreen from './src/screens/StationDetailsScreen';
import TicketScreen from './src/screens/TicketScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AddVehicleScreen from './src/screens/AddVehicleScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';

// Operator imports
import { OperatorAuthContext, OperatorAuthProvider } from './src/context/OperatorAuthContext';
import OperatorLoginScreen from './src/screens/operator/OperatorLoginScreen';
import OperatorDashboardScreen from './src/screens/operator/OperatorDashboardScreen';

// Role selection
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';

// Bottom Tab Bar
import BottomTabBar from './src/components/BottomTabBar';

import { darkTheme } from './src/theme/darkTheme';
import { newTheme } from './src/theme/newTheme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Helper function to get URL parameters on web
const getUrlParams = () => {
    if (Platform.OS === 'web') {
        const params = new URLSearchParams(window.location.search);
        return {
            resetToken: params.get('resetToken') || params.get('token'),
            path: window.location.pathname
        };
    }
    return { resetToken: null, path: null };
};

// Bottom Tab Navigator
function MainTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <BottomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="StationList"
                component={StationListScreen}
                options={{ tabBarLabel: 'Map' }}
            />
            <Tab.Screen
                name="Ticket"
                component={TicketScreen}
                options={{ tabBarLabel: 'My Ticket' }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarLabel: 'Profile' }}
            />
        </Tab.Navigator>
    );
}

// User Navigation with Stack for modals
function UserAuth() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="StationDetails" component={StationDetailsScreen} />
            <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        </Stack.Navigator>
    );
}

// Reset Password Navigator
function ResetPasswordNavigator({ token, onBack }) {
    const linking = {
        prefixes: ['http://localhost:8082', 'exp://'],
        config: {
            screens: {
                ResetPassword: 'reset-password',
                Login: 'login',
            },
        },
    };

    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ResetPassword">
                <Stack.Screen name="ResetPassword">
                    {(props) => <ResetPasswordScreen {...props} route={{ params: { token } }} />}
                </Stack.Screen>
                <Stack.Screen name="Login" component={LoginScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

function UserNavigator({ onBack }) {
    const { user, isLoading } = useContext(AuthContext);

    const linking = {
        prefixes: ['http://localhost:8082', 'exp://'],
        config: {
            screens: {
                Login: 'login',
                Register: 'register',
                ForgotPassword: 'forgot-password',
                ResetPassword: 'reset-password',
                MainTabs: {
                    screens: {
                        StationList: 'stations',
                        Ticket: 'ticket',
                        Settings: 'settings',
                    },
                },
                StationDetails: 'station/:id',
                AddVehicle: 'add-vehicle',
                EditProfile: 'edit-profile',
            },
        },
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkTheme.colors.background }}>
                <ActivityIndicator size="large" color={darkTheme.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer linking={linking}>
            {user ? <UserAuth /> : (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Login">
                        {(props) => <LoginScreen {...props} onBack={onBack} />}
                    </Stack.Screen>
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
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

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {operator ? (
                    <Stack.Screen name="OperatorDashboard" component={OperatorDashboardScreen} />
                ) : (
                    <Stack.Screen name="OperatorLogin">
                        {(props) => <OperatorLoginScreen {...props} onBack={onBack} />}
                    </Stack.Screen>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// Main App with Role Selection
function AppContent() {
    const [selectedRole, setSelectedRole] = useState(null);
    const [checkingRole, setCheckingRole] = useState(true);
    const [resetToken, setResetToken] = useState(null);

    useEffect(() => {
        // Check if there's a saved role and handle reset password URL
        const checkSavedRole = async () => {
            try {
                // Check for reset password token in URL or sessionStorage
                const urlParams = getUrlParams();
                console.log('URL params:', urlParams);
                
                let token = urlParams.resetToken;
                
                // Check sessionStorage for token (set by index.html redirect)
                if (!token && Platform.OS === 'web') {
                    token = sessionStorage.getItem('resetToken');
                    if (token) {
                        sessionStorage.removeItem('resetToken');
                        console.log('Found reset token in sessionStorage:', token);
                    }
                }
                
                if (token) {
                    console.log('Found reset token:', token);
                    setResetToken(token);
                    setSelectedRole('user'); // Force user role for password reset
                    setCheckingRole(false);
                    return;
                }
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
        setResetToken(null);
        await AsyncStorage.removeItem('selected_role');
    };

    if (checkingRole) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkTheme.colors.background }}>
                <ActivityIndicator size="large" color={darkTheme.colors.primary} />
            </View>
        );
    }

    // If we have a reset token, show user auth with reset password
    if (resetToken) {
        return (
            <AuthProvider>
                <ResetPasswordNavigator token={resetToken} onBack={handleBackToRoleSelection} />
            </AuthProvider>
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
