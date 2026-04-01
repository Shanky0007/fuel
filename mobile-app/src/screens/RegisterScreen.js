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
import { newTheme } from '../theme/newTheme';
import { lookupService } from '../services/api';

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('');
    const [region, setRegion] = useState('');
    const [city, setCity] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [fuelType, setFuelType] = useState('');

    const [countries, setCountries] = useState([]);
    const [regions, setRegions] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountryId, setSelectedCountryId] = useState('');
    const [selectedRegionId, setSelectedRegionId] = useState('');
    const [loadingCountries, setLoadingCountries] = useState(true);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

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

    useEffect(() => {
        if (selectedRegionId) {
            fetchCities(selectedRegionId);
        }
    }, [selectedRegionId]);

    const fetchCountries = async () => {
        try {
            const data = await lookupService.getCountries();
            setCountries(data);
        } catch (error) {
            console.error('Error fetching countries:', error);
        } finally {
            setLoadingCountries(false);
        }
    };

    const fetchRegions = async (countryId) => {
        setLoadingRegions(true);
        try {
            const data = await lookupService.getRegionsByCountry(countryId);
            setRegions(data);
        } catch (error) {
            console.error('Error fetching regions:', error);
        } finally {
            setLoadingRegions(false);
        }
    };

    const fetchCities = async (regionId) => {
        setLoadingCities(true);
        try {
            const data = await lookupService.getCitiesByRegion(regionId);
            setCities(data);
        } catch (error) {
            console.error('Error fetching cities:', error);
        } finally {
            setLoadingCities(false);
        }
    };

    const handleCountryChange = (countryId) => {
        setSelectedCountryId(countryId);
        const selectedCountry = countries.find(c => c.id === countryId);
        if (selectedCountry) {
            setCountry(selectedCountry.name);
        }
        setRegion('');
        setCity('');
        setRegions([]);
        setCities([]);
        setSelectedRegionId('');
    };

    const handleRegionChange = (regionId) => {
        setSelectedRegionId(regionId);
        const selectedRegion = regions.find(r => r.id === regionId);
        if (selectedRegion) {
            setRegion(selectedRegion.name);
        }
        setCity('');
        setCities([]);
    };

    const handleCityChange = (cityId) => {
        const selectedCity = cities.find(c => c.id === cityId);
        if (selectedCity) {
            setCity(selectedCity.name);
        }
    };

    const handleRegister = async () => {
        const showAlert = (title, message) => {
            if (Platform.OS === 'web') {
                window.alert(message || title);
            } else {
                Alert.alert(title, message);
            }
        };

        if (!name || !email || !password) {
            showAlert('Error', 'Please fill in all required fields');
            return;
        }
        if (!country || !region) {
            showAlert('Error', 'Please select your country and region');
            return;
        }
        if (!city) {
            showAlert('Error', 'Please select your city');
            return;
        }
        if (!registrationNumber) {
            showAlert('Error', 'Please enter your vehicle registration number');
            return;
        }
        if (!vehicleType || !fuelType) {
            showAlert('Error', 'Please select your vehicle type and fuel type');
            return;
        }

        try {
            await register(name, email, password, phone, country, region, city, vehicleType, fuelType, registrationNumber);
        } catch (error) {
            showAlert('Registration Failed', error.response?.data?.error || 'Something went wrong');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={newTheme.colors.bg} />

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
                            <View style={styles.logoIcon}>
                              <Text style={{ fontSize: 32 }}>⛽</Text>
                            </View>
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
                                    placeholderTextColor={newTheme.colors.text3}
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
                                    placeholderTextColor={newTheme.colors.text3}
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
                                    placeholder="+27 12 345 6789"
                                    placeholderTextColor={newTheme.colors.text3}
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
                                    placeholderTextColor={newTheme.colors.text3}
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
                                        dropdownIconColor={newTheme.colors.text}
                                    >
                                        <Picker.Item label="Select Country" value="" color={newTheme.colors.text2} />
                                        {countries.map((c) => (
                                            <Picker.Item key={c.id} label={c.name} value={c.id} color={newTheme.colors.text} />
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
                                        dropdownIconColor={newTheme.colors.text}
                                        enabled={regions.length > 0}
                                    >
                                        <Picker.Item
                                            label={loadingRegions ? "Loading..." : "Select Region"}
                                            value=""
                                            color={newTheme.colors.text2}
                                        />
                                        {regions.map((r) => (
                                            <Picker.Item key={r.id} label={r.name} value={r.name} color={newTheme.colors.text} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {/* City */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>City *</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={city}
                                        onValueChange={(itemValue, itemIndex) => {
                                            if (itemIndex > 0) {
                                                handleCityChange(cities[itemIndex - 1]?.id);
                                            }
                                        }}
                                        style={styles.picker}
                                        dropdownIconColor={newTheme.colors.text}
                                        enabled={cities.length > 0}
                                    >
                                        <Picker.Item
                                            label={loadingCities ? "Loading..." : "Select City"}
                                            value=""
                                            color={newTheme.colors.text2}
                                        />
                                        {cities.map((c) => (
                                            <Picker.Item key={c.id} label={c.name} value={c.name} color={newTheme.colors.text} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {/* Registration Number */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Vehicle Plate Number *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. CA 123456"
                                    placeholderTextColor={newTheme.colors.text3}
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
                                        dropdownIconColor={newTheme.colors.text}
                                    >
                                        <Picker.Item label="Select Type" value="" color={newTheme.colors.text2} />
                                        {vehicleTypes.map((type) => (
                                            <Picker.Item key={type} label={type} value={type} color={newTheme.colors.text} />
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
                                        dropdownIconColor={newTheme.colors.text}
                                    >
                                        <Picker.Item label="Select Fuel" value="" color={newTheme.colors.text2} />
                                        {fuelTypes.map((type) => (
                                            <Picker.Item key={type} label={type} value={type} color={newTheme.colors.text} />
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
                                {isLoading ? (
                                    <ActivityIndicator color={newTheme.colors.bg} />
                                ) : (
                                    <Text style={styles.buttonText}>Create Account</Text>
                                )}
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
        backgroundColor: newTheme.colors.bg,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 16,
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
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: newTheme.colors.text2,
        marginTop: 4,
    },
    formCard: {
        backgroundColor: newTheme.colors.bg2,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: newTheme.colors.border,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: newTheme.colors.text3,
        letterSpacing: 1,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: newTheme.colors.bg3,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: newTheme.colors.border,
        fontSize: 15,
        color: newTheme.colors.text,
        minHeight: 54,
    },
    pickerContainer: {
        backgroundColor: newTheme.colors.bg3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: newTheme.colors.border,
        overflow: 'hidden',
    },
    picker: {
        color: newTheme.colors.text,
        backgroundColor: newTheme.colors.bg3,
        height: 54,
    },
    button: {
        height: 54,
        backgroundColor: newTheme.colors.amber,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
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
    linkContainer: {
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    linkText: {
        color: newTheme.colors.text2,
        textAlign: 'center',
        fontSize: 13,
    },
    linkBold: {
        color: newTheme.colors.amber,
        fontWeight: '700',
    },
});
