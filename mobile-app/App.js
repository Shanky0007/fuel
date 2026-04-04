import React, { useContext, useState, useEffect, useRef } from 'react';
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

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const linking = {
    prefixes: ['mobileapp://', 'exp://'],
    config: {
        screens: {
            RoleSelection: '',
            UserFlow: {
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
            OperatorFlow: {
                screens: {
                    OperatorLogin: 'operator-login',
                    OperatorDashboard: 'operator-dashboard',
                },
            },
        },
    },
};

function MainTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <BottomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="StationList" component={StationListScreen} options={{ tabBarLabel: 'Map' }} />
            <Tab.Screen name="Ticket" component={TicketScreen} options={{ tabBarLabel: 'My Ticket' }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Profile' }} />
        </Tab.Navigator>
    );
}

function UserFlow({ onBack, resetToken }) {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkTheme.colors.background }}>
                <ActivityIndicator size="large" color={darkTheme.colors.primary} />
            </View>
        );
    }

    if (user) {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="StationDetails" component={StationDetailsScreen} />
                <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            </Stack.Navigator>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={resetToken ? 'ResetPassword' : 'Login'}>
            <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} onBack={onBack} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword">
                {(props) => <ResetPasswordScreen {...props} route={{ ...props.route, params: { ...props.route?.params, token: resetToken || props.route?.params?.token } }} />}
            </Stack.Screen>
        </Stack.Navigator>
    );
}

function OperatorFlow({ onBack }) {
    const { operator, isLoading } = useContext(OperatorAuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkTheme.colors.background }}>
                <ActivityIndicator size="large" color={darkTheme.colors.success} />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {operator ? (
                <Stack.Screen name="OperatorDashboard" component={OperatorDashboardScreen} />
            ) : (
                <Stack.Screen name="OperatorLogin">
                    {(props) => <OperatorLoginScreen {...props} onBack={onBack} />}
                </Stack.Screen>
            )}
        </Stack.Navigator>
    );
}

function AppNavigator() {
    const [selectedRole, setSelectedRole] = useState(null);
    const [checkingRole, setCheckingRole] = useState(true);
    const [resetToken, setResetToken] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                if (Platform.OS === 'web') {
                    const params = new URLSearchParams(window.location.search);
                    let token = params.get('resetToken') || params.get('token');
                    if (!token) {
                        token = sessionStorage.getItem('resetToken');
                        if (token) sessionStorage.removeItem('resetToken');
                    }
                    if (token) {
                        setResetToken(token);
                        setSelectedRole('user');
                        return;
                    }
                }
            } catch (e) {
                console.error('Failed to init app:', e);
            } finally {
                setCheckingRole(false);
            }
        };
        init();
    }, []);

    const handleSelectRole = async (role) => {
        setSelectedRole(role);
        await AsyncStorage.setItem('selected_role', role);
    };

    const handleBack = async () => {
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

    if (!selectedRole) {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="RoleSelection">
                    {() => <RoleSelectionScreen onSelectRole={handleSelectRole} />}
                </Stack.Screen>
            </Stack.Navigator>
        );
    }

    if (selectedRole === 'operator') {
        return (
            <OperatorAuthProvider>
                <OperatorFlow onBack={handleBack} />
            </OperatorAuthProvider>
        );
    }

    return (
        <AuthProvider>
            <UserFlow onBack={handleBack} resetToken={resetToken} />
        </AuthProvider>
    );
}

export default function App() {
    return (
        <NavigationContainer linking={linking}>
            <AppNavigator />
        </NavigationContainer>
    );
}
