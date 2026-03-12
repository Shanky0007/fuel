import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    KeyboardAvoidingView,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../context/AuthContext';
import { darkTheme } from '../theme/darkTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../config';
import axios from 'axios';

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('');
    const [region, setRegion] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [fuelType, setFuelType] = useState('');

    const [countries, setCountries] = useState([]);
    const [regions, setRegions] = useState([]);
    const [selectedCountryId, setSelectedCountryId] = useState('');
    const [loadingCountries, setLoadingCountries] = useState(true);
    const [loadingRegions, setLoadingRegions] = useState(false);

    const { register, isLoading } = useContext(AuthContext);

    const vehicleTypes = ['Car', 'Motorcycle', 'Truck', 'Bus']; // Updated to match backend types
    const fuelTypes = ['Petrol', 'Diesel', 'EV', 'CNG']; // Updated to match commonly used types

    useEffect(() => {
        fetchCountries();
    }, []);

    useEffect(() => {
        if (selectedCountryId) {
            fetchRegions(selectedCountryId);
        }
    }, [selectedCountryId]);

    const fetchCountries = async () => {
        try {
            const response = await axios.get(`${API_URL}/locations/countries`);
            setCountries(response.data);
        } catch (error) {
            console.error('Error fetching countries:', error);
        } finally {
            setLoadingCountries(false);
        }
    };

    const fetchRegions = async (countryId) => {
        setLoadingRegions(true);
        try {
            const response = await axios.get(`${API_URL}/locations/countries/${countryId}/regions`);
            setRegions(response.data);
        } catch (error) {
            console.error('Error fetching regions:', error);
        } finally {
            setLoadingRegions(false);
        }
    };

    const handleCountryChange = (countryId) => {
        setSelectedCountryId(countryId);
        const selectedCountry = countries.find(c => c.id === countryId);
        if (selectedCountry) {
            setCountry(selectedCountry.name);
        }
        setRegion('');
        setRegions([]);
    };

    const handleRegionChange = (regionId) => {
        const selectedRegion = regions.find(r => r.id === regionId);
        if (selectedRegion) {
            setRegion(selectedRegion.name);
        }
    };

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        if (!country || !region) {
            Alert.alert('Error', 'Please select your country and region');
            return;
        }
        if (!registrationNumber) {
            Alert.alert('Error', 'Please enter your vehicle registration number');
            return;
        }
        if (!vehicleType || !fuelType) {
            Alert.alert('Error', 'Please select your vehicle type and fuel type');
            return;
        }

        try {
            await register(name, email, password, phone, country, region, vehicleType, fuelType, registrationNumber);
        } catch (error) {
            Alert.alert('Registration Failed', error.response?.data?.error || 'Something went wrong');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={darkTheme.colors.background} />

            {/* Background effects */}
            <View style={styles.backgroundOverlay}>
                <View style={styles.gradientCircle1} />
                <View style={styles.gradientCircle2} />
            </View>

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.logoIcon}>🚀</Text>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join the smart fuel queue system</Text>
                        </View>

                        {/* Form Card */}
                        <View style={styles.formCard}>
                            {/* Full Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor={darkTheme.colors.textTertiary}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            {/* Email */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email *</Text>
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

                            {/* Phone */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="+1 234 567 8900"
                                    placeholderTextColor={darkTheme.colors.textTertiary}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            {/* Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={darkTheme.colors.textTertiary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            {/* Country */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Country *</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={selectedCountryId}
                                        onValueChange={handleCountryChange}
                                        style={styles.picker}
                                        dropdownIconColor={darkTheme.colors.text}
                                    >
                                        <Picker.Item label="Select Country" value="" color={darkTheme.colors.textSecondary} />
                                        {countries.map((c) => (
                                            <Picker.Item key={c.id} label={c.name} value={c.id} color={darkTheme.colors.text} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {/* Region */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Region *</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={region}
                                        onValueChange={(itemValue, itemIndex) => {
                                            if (itemIndex > 0) {
                                                handleRegionChange(regions[itemIndex - 1]?.id);
                                            }
                                        }}
                                        style={styles.picker}
                                        dropdownIconColor={darkTheme.colors.text}
                                        enabled={regions.length > 0}
                                    >
                                        <Picker.Item
                                            label={loadingRegions ? "Loading..." : "Select Region"}
                                            value=""
                                            color={darkTheme.colors.textSecondary}
                                        />
                                        {regions.map((r) => (
                                            <Picker.Item key={r.id} label={r.name} value={r.name} color={darkTheme.colors.text} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {/* Registration Number */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Vehicle Plate Number *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. KA01AB1234"
                                    placeholderTextColor={darkTheme.colors.textTertiary}
                                    value={registrationNumber}
                                    onChangeText={val => setRegistrationNumber(val.toUpperCase())}
                                    autoCapitalize="characters"
                                />
                            </View>

                            {/* Vehicle Type */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Vehicle Type *</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={vehicleType}
                                        onValueChange={setVehicleType}
                                        style={styles.picker}
                                        dropdownIconColor={darkTheme.colors.text}
                                    >
                                        <Picker.Item label="Select Type" value="" color={darkTheme.colors.textSecondary} />
                                        {vehicleTypes.map((type) => (
                                            <Picker.Item key={type} label={type} value={type} color={darkTheme.colors.text} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {/* Fuel Type */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Fuel Type *</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={fuelType}
                                        onValueChange={setFuelType}
                                        style={styles.picker}
                                        dropdownIconColor={darkTheme.colors.text}
                                    >
                                        <Picker.Item label="Select Fuel" value="" color={darkTheme.colors.textSecondary} />
                                        {fuelTypes.map((type) => (
                                            <Picker.Item key={type} label={type} value={type} color={darkTheme.colors.text} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {/* Register Button */}
                            <TouchableOpacity
                                style={[styles.button, isLoading && styles.buttonDisabled]}
                                onPress={handleRegister}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={darkTheme.colors.gradientAccent}
                                    style={styles.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={darkTheme.colors.white} />
                                    ) : (
                                        <Text style={styles.buttonText}>Create Account</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Login Link */}
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Login')}
                                style={styles.linkContainer}
                            >
                                <Text style={styles.linkText}>
                                    Already have an account? <Text style={styles.linkBold}>Sign In</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
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
        zIndex: 0,
    },
    gradientCircle1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: darkTheme.colors.accentGlow,
        opacity: 0.4,
    },
    gradientCircle2: {
        position: 'absolute',
        bottom: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: darkTheme.colors.primaryGlow,
        opacity: 0.4,
    },
    safeArea: {
        flex: 1,
        zIndex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: darkTheme.spacing.lg,
        paddingBottom: darkTheme.spacing.xxl,
    },
    header: {
        alignItems: 'center',
        marginBottom: darkTheme.spacing.lg,
        marginTop: darkTheme.spacing.md,
    },
    logoIcon: {
        fontSize: 48,
        marginBottom: darkTheme.spacing.sm,
    },
    title: {
        fontSize: darkTheme.fontSize.xxl,
        fontWeight: darkTheme.fontWeight.extrabold,
        color: darkTheme.colors.text,
        letterSpacing: -0.5,
        marginBottom: darkTheme.spacing.xs,
    },
    subtitle: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.textSecondary,
        marginTop: darkTheme.spacing.xs,
    },
    formCard: {
        backgroundColor: darkTheme.colors.surface,
        borderRadius: darkTheme.borderRadius.lg,
        padding: darkTheme.spacing.lg,
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
        ...darkTheme.shadows.large,
    },
    inputGroup: {
        marginBottom: darkTheme.spacing.md,
    },
    label: {
        fontSize: darkTheme.fontSize.sm,
        fontWeight: darkTheme.fontWeight.semibold,
        color: darkTheme.colors.text,
        marginBottom: darkTheme.spacing.xs,
    },
    input: {
        backgroundColor: darkTheme.colors.card,
        padding: darkTheme.spacing.md,
        borderRadius: darkTheme.borderRadius.md,
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
        fontSize: darkTheme.fontSize.md,
        color: darkTheme.colors.text,
        minHeight: 48,
    },
    pickerContainer: {
        backgroundColor: darkTheme.colors.card,
        borderRadius: darkTheme.borderRadius.md,
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
        overflow: 'hidden',
    },
    picker: {
        color: darkTheme.colors.text,
        backgroundColor: darkTheme.colors.card,
        height: 50,
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: darkTheme.spacing.lg,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        padding: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: darkTheme.colors.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    linkContainer: {
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    linkText: {
        color: darkTheme.colors.textSecondary,
        textAlign: 'center',
        fontSize: 14,
    },
    linkBold: {
        color: darkTheme.colors.accent,
        fontWeight: '700',
    },
});
