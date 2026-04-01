import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { newTheme } from '../theme/newTheme';

export default function LoginScreen({ navigation, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useContext(AuthContext);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(message || title);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      showAlert('Login Failed', error.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      {onBack && (
        <SafeAreaView style={styles.backButtonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoIcon}>
              <Text style={{ fontSize: 32 }}>⛽</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.formGroup}>
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

            <View style={styles.formGroup}>
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
              style={styles.btnPrimary}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={newTheme.colors.bg} />
              ) : (
                <Text style={styles.btnPrimaryText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotLink}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={styles.signupLink}
            >
              <Text style={styles.signupText}>
                Don't have an account?{' '}
                <Text style={styles.signupBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
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
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: newTheme.colors.text2,
  },
  formCard: {
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 24,
    padding: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: newTheme.colors.text3,
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    height: 54,
    backgroundColor: newTheme.colors.bg3,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: newTheme.colors.text,
  },
  btnPrimary: {
    height: 54,
    backgroundColor: newTheme.colors.amber,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: newTheme.colors.bg,
    letterSpacing: -0.2,
  },
  forgotLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotText: {
    fontSize: 13,
    color: newTheme.colors.amber,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: newTheme.colors.border,
    marginVertical: 16,
  },
  signupLink: {
    alignItems: 'center',
  },
  signupText: {
    fontSize: 13,
    color: newTheme.colors.text2,
  },
  signupBold: {
    color: newTheme.colors.amber,
    fontWeight: '700',
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
