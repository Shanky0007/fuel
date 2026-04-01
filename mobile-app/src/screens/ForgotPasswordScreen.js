import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar } from 'react-native';
import { newTheme } from '../theme/newTheme';
import axios from 'axios';
import { API_URL } from '../config';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const showAlert = (title, message, onPress) => {
        if (Platform.OS === 'web') {
            window.alert(message || title);
            if (onPress) onPress();
        } else {
            Alert.alert(title, message, onPress ? [{ text: 'OK', onPress }] : undefined);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            showAlert('Error', 'Please enter your email address');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
            showAlert(
                'Success',
                response.data.message,
                () => navigation.goBack()
            );
        } catch (error) {
            showAlert('Error', error.response?.data?.error || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Back button */}
            <SafeAreaView style={styles.backButtonContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.logoIcon}>
                            <Text style={{ fontSize: 32 }}>🔑</Text>
                        </View>
                        <Text style={styles.title}>Forgot Password?</Text>
                        <Text style={styles.subtitle}>
                            Enter your email address and we'll send you a link to reset your password
                        </Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>EMAIL</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="your@email.com"
                                    placeholderTextColor={newTheme.colors.text3}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, isLoading && styles.buttonDisabled]}
                                onPress={handleForgotPassword}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={newTheme.colors.bg} />
                                ) : (
                                    <Text style={styles.buttonText}>Send Reset Link</Text>
                                )}
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
        backgroundColor: newTheme.colors.bg,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoIcon: {
        width: 64,
        height: 64,
        backgroundColor: newTheme.colors.amber,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: newTheme.colors.text,
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: newTheme.colors.text2,
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    formCard: {
        backgroundColor: newTheme.colors.bg2,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: newTheme.colors.border,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: newTheme.colors.text3,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: newTheme.colors.bg3,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: newTheme.colors.border,
        fontSize: 15,
        color: newTheme.colors.text,
        height: 54,
    },
    button: {
        height: 54,
        backgroundColor: newTheme.colors.amber,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: newTheme.colors.bg,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    backButtonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    backButton: {
        paddingVertical: 8,
    },
    backButtonText: {
        color: newTheme.colors.amber,
        fontSize: 14,
        fontWeight: '600',
    },
});
