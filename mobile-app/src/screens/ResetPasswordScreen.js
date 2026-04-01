import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar } from 'react-native';
import { darkTheme } from '../theme/darkTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../config';

export default function ResetPasswordScreen({ navigation, route }) {
    const { token } = route.params || {};
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        console.log('ResetPasswordScreen mounted with token:', token);
    }, [token]);

    const showAlert = (title, message, onPress) => {
        if (Platform.OS === 'web') {
            window.alert(message || title);
            if (onPress) onPress();
        } else {
            Alert.alert(title, message, onPress ? [{ text: 'OK', onPress }] : undefined);
        }
    };

    const handleResetPassword = async () => {
        console.log('Reset password clicked, token:', token);
        
        if (!newPassword || !confirmPassword) {
            showAlert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword.length < 6) {
            showAlert('Error', 'Password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('Error', 'Passwords do not match');
            return;
        }

        if (!token) {
            showAlert('Error', 'Invalid reset token');
            return;
        }

        console.log('Sending reset password request...');
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword
                })
            });

            const data = await response.json();
            console.log('Reset password response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            showAlert(
                'Success',
                'Password has been reset successfully. Please login with your new password.',
                () => {
                    // Reload the page to reset the app state
                    if (Platform.OS === 'web') {
                        window.location.href = '/';
                    } else {
                        navigation.navigate('Login');
                    }
                }
            );
        } catch (error) {
            console.error('Reset password error:', error);
            showAlert('Error', error.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background gradient overlay */}
            <View style={styles.backgroundOverlay}>
                <View style={styles.gradientCircle1} />
                <View style={styles.gradientCircle2} />
            </View>

            {/* Back button */}
            <SafeAreaView style={styles.backButtonContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.backButtonText}>← Back to Login</Text>
                </TouchableOpacity>
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>
                            Enter your new password below
                        </Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>New Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={darkTheme.colors.textTertiary}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={darkTheme.colors.textTertiary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleResetPassword}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={darkTheme.colors.gradientPrimary}
                                    style={styles.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={darkTheme.colors.white} />
                                    ) : (
                                        <Text style={styles.buttonText}>Reset Password</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkTheme.colors.background,
    },
    backgroundOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    gradientCircle1: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: darkTheme.colors.primaryGlow,
        opacity: 0.5,
    },
    gradientCircle2: {
        position: 'absolute',
        bottom: -150,
        right: -100,
        width: 500,
        height: 500,
        borderRadius: 250,
        backgroundColor: darkTheme.colors.accentGlow,
        opacity: 0.5,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: darkTheme.spacing.lg,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: darkTheme.spacing.xl,
    },
    title: {
        fontSize: darkTheme.fontSize.xxxl,
        fontWeight: darkTheme.fontWeight.extrabold,
        color: darkTheme.colors.text,
        marginBottom: darkTheme.spacing.sm,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: darkTheme.fontSize.md,
        color: darkTheme.colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: darkTheme.spacing.md,
    },
    formCard: {
        backgroundColor: darkTheme.colors.surface,
        borderRadius: darkTheme.borderRadius.xxl,
        padding: darkTheme.spacing.xl,
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
        ...darkTheme.shadows.large,
    },
    form: {
        gap: darkTheme.spacing.lg,
    },
    inputContainer: {
        gap: darkTheme.spacing.sm,
    },
    label: {
        fontSize: darkTheme.fontSize.sm,
        fontWeight: darkTheme.fontWeight.semibold,
        color: darkTheme.colors.text,
    },
    input: {
        backgroundColor: darkTheme.colors.card,
        padding: darkTheme.spacing.md,
        borderRadius: darkTheme.borderRadius.md,
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
        fontSize: darkTheme.fontSize.md,
        color: darkTheme.colors.text,
    },
    button: {
        borderRadius: darkTheme.borderRadius.md,
        overflow: 'hidden',
        marginTop: darkTheme.spacing.md,
    },
    buttonGradient: {
        padding: darkTheme.spacing.md,
        alignItems: 'center',
    },
    buttonText: {
        color: darkTheme.colors.white,
        fontSize: darkTheme.fontSize.md,
        fontWeight: darkTheme.fontWeight.bold,
        letterSpacing: 0.5,
    },
    backButtonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingHorizontal: darkTheme.spacing.lg,
        paddingTop: darkTheme.spacing.sm,
    },
    backButton: {
        paddingVertical: darkTheme.spacing.sm,
    },
    backButtonText: {
        color: darkTheme.colors.primary,
        fontSize: darkTheme.fontSize.md,
        fontWeight: darkTheme.fontWeight.semibold,
    },
});
