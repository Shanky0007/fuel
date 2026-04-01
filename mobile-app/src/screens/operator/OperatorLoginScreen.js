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
import { OperatorAuthContext } from '../../context/OperatorAuthContext';
import { newTheme } from '../../theme/newTheme';

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
            console.log('Starting login process...');
            const success = await login(email.trim(), password);
            console.log('Login returned:', success);
            // Don't navigate - let the auth context handle it
        } catch (e) {
            console.error('Login failed:', e);
            const errorMessage = e.response?.data?.error || e.message || 'Login failed. Please check your credentials.';
            setError(errorMessage);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={newTheme.colors.bg} />

            {/* Back button */}
            <SafeAreaView style={styles.backButtonContainer}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
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
                            <View style={styles.logoIcon}>
                                <Text style={{ fontSize: 32 }}>👷</Text>
                            </View>
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
                                    <Text style={styles.label}>EMAIL</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="operator@example.com"
                                        placeholderTextColor={newTheme.colors.text3}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>PASSWORD</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor={newTheme.colors.text3}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, isLoading && styles.buttonDisabled]}
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                    activeOpacity={0.8}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={newTheme.colors.bg} />
                                    ) : (
                                        <Text style={styles.buttonText}>Sign In</Text>
                                    )}
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
        backgroundColor: newTheme.colors.bg,
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
        color: newTheme.colors.green,
        fontSize: 14,
        fontWeight: '600',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
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
        backgroundColor: newTheme.colors.green,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: newTheme.colors.text,
        marginBottom: 4,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: newTheme.colors.text2,
        textAlign: 'center',
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
    errorContainer: {
        backgroundColor: 'rgba(248,113,113,0.15)',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: newTheme.colors.red,
    },
    errorText: {
        color: newTheme.colors.red,
        textAlign: 'center',
        fontSize: 13,
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
        backgroundColor: newTheme.colors.green,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: newTheme.colors.bg,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
});
