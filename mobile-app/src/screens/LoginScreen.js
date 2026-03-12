import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { darkTheme } from '../theme/darkTheme';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation, onBack }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading } = useContext(AuthContext);

    const handleLogin = async () => {
        try {
            await login(email, password);
        } catch (error) {
            Alert.alert('Login Failed', error.response?.data?.error || 'Something went wrong');
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
            {onBack && (
                <SafeAreaView style={styles.backButtonContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <Text style={styles.backButtonText}>← Back to Roles</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to continue your journey</Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="your@email.com"
                                    placeholderTextColor={darkTheme.colors.textTertiary}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={darkTheme.colors.textTertiary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleLogin}
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
                                        <Text style={styles.buttonText}>Sign In</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('Register')}
                                style={styles.linkContainer}
                            >
                                <Text style={styles.linkText}>
                                    Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
                                </Text>
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
    linkContainer: {
        paddingVertical: darkTheme.spacing.sm,
    },
    linkText: {
        color: darkTheme.colors.textSecondary,
        textAlign: 'center',
        fontSize: darkTheme.fontSize.sm,
    },
    linkBold: {
        color: darkTheme.colors.primary,
        fontWeight: darkTheme.fontWeight.bold,
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
