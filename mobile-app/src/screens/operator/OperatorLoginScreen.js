import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OperatorAuthContext } from '../../context/OperatorAuthContext';
import { darkTheme } from '../../theme/darkTheme';

export default function OperatorLoginScreen({ onBack }) {
    const { login, isLoading } = useContext(OperatorAuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setError('');
            await login(email.trim(), password);
        } catch (e) {
            const errorMessage = e.response?.data?.error || e.message || 'Login failed. Please check your credentials.';
            setError(errorMessage);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={darkTheme.colors.background} />

            {/* Background glow effects */}
            <View style={styles.backgroundOverlay}>
                <View style={styles.gradientCircle1} />
                <View style={styles.gradientCircle2} />
            </View>

            {/* Back button */}
            <SafeAreaView style={styles.backButtonContainer}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back to Roles</Text>
                </TouchableOpacity>
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.logoIcon}>👷</Text>
                            <Text style={styles.title}>Operator Portal</Text>
                            <Text style={styles.subtitle}>Sign in to manage queue operations</Text>
                        </View>

                        <View style={styles.formCard}>
                            <View style={styles.form}>
                                {error ? (
                                    <View style={styles.errorContainer}>
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                ) : null}

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="operator@example.com"
                                        placeholderTextColor={darkTheme.colors.textTertiary}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
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
                                        colors={darkTheme.colors.gradientSuccess}
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
                            </View>
                        </View>
                    </View>
                </ScrollView>
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
        backgroundColor: darkTheme.colors.successGlow,
        opacity: 0.5,
    },
    gradientCircle2: {
        position: 'absolute',
        bottom: -150,
        right: -100,
        width: 500,
        height: 500,
        borderRadius: 250,
        backgroundColor: darkTheme.colors.primaryGlow,
        opacity: 0.5,
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
        color: darkTheme.colors.success,
        fontSize: darkTheme.fontSize.md,
        fontWeight: darkTheme.fontWeight.semibold,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
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
    logoIcon: {
        fontSize: 64,
        marginBottom: darkTheme.spacing.md,
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
    errorContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderRadius: darkTheme.borderRadius.md,
        padding: darkTheme.spacing.md,
        borderWidth: 1,
        borderColor: darkTheme.colors.error,
    },
    errorText: {
        color: darkTheme.colors.errorLight,
        textAlign: 'center',
        fontSize: darkTheme.fontSize.sm,
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
});
