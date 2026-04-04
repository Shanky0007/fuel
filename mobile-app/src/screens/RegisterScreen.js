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
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../theme/useTheme';
import { lookupService } from '../services/api';
import CustomPicker from '../components/CustomPicker';

export default function RegisterScreen({ navigation }) {
    const colors = useTheme();
    const styles = makeStyles(colors);

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
    const [loadingCountries, setLoadingCountries] = useState(true);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    const { register, isLoading } = useContext(AuthContext);

    const vehicleTypes = ['Car', 'Motorcycle', 'Truck', 'Bus'];
    const fuelTypes = ['Petrol', 'Diesel', 'EV', 'CNG'];

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const data = await lookupService.getCountries();
            setCountries(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching countries:', error);
        } finally {
            setLoadingCountries(false);
        }
    };

    const handleCountrySelect = async (countryId) => {
        const c = countries.find(c => c.id === countryId);
        setCountry(c ? c.name : '');
        setRegion('');
        setCity('');
        setRegions([]);
        setCities([]);
        if (!countryId) return;
        setLoadingRegions(true);
        try {
            const data = await lookupService.getRegionsByCountry(countryId);
            setRegions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching regions:', error);
        } finally {
            setLoadingRegions(false);
        }
    };

    const handleRegionSelect = async (regionId) => {
        const r = regions.find(r => r.id === regionId);
        setRegion(r ? r.name : '');
        setCity('');
        setCities([]);
        if (!regionId) return;
        setLoadingCities(true);
        try {
            const data = await lookupService.getCitiesByRegion(regionId);
            setCities(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching cities:', error);
        } finally {
            setLoadingCities(false);
        }
    };

    const handleRegister = async () => {
        const showAlert = (title, message) => {
            Platform.OS === 'web' ? window.alert(message || title) : Alert.alert(title, message);
        };
        if (!name || !email || !password) { showAlert('Error', 'Please fill in all required fields'); return; }
        if (!country) { showAlert('Error', 'Please select your country'); return; }
        if (!region) { showAlert('Error', 'Please select your state/region'); return; }
        if (!city) { showAlert('Error', 'Please select your city'); return; }
        if (!registrationNumber) { showAlert('Error', 'Please enter your vehicle registration number'); return; }
        if (!vehicleType || !fuelType) { showAlert('Error', 'Please select your vehicle type and fuel type'); return; }

        try {
            await register(name, email, password, phone, country, region, city, vehicleType, fuelType, registrationNumber);
        } catch (error) {
            showAlert('Registration Failed', error.response?.data?.error || 'Something went wrong');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle={colors.text === '#F0F2F7' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.header}>
                            <View style={styles.logoIcon}>
                                <Text style={{ fontSize: 32 }}>⛽</Text>
                            </View>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join the smart fuel queue system</Text>
                        </View>

                        <View style={styles.formCard}>
                            <Text style={styles.label}>FULL NAME *</Text>
                            <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor={colors.text3} value={name} onChangeText={setName} />

                            <Text style={styles.label}>EMAIL *</Text>
                            <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor={colors.text3} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

                            <Text style={styles.label}>PHONE</Text>
                            <TextInput style={styles.input} placeholder="Phone number" placeholderTextColor={colors.text3} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

                            <Text style={styles.label}>PASSWORD *</Text>
                            <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={colors.text3} value={password} onChangeText={setPassword} secureTextEntry />

                            <CustomPicker
                                label="COUNTRY *"
                                value={country}
                                placeholder={loadingCountries ? 'Loading...' : 'Select Country'}
                                items={countries.map(c => ({ label: c.name, value: c.id }))}
                                onSelect={handleCountrySelect}
                                disabled={loadingCountries}
                            />

                            <CustomPicker
                                label="STATE / REGION *"
                                value={region}
                                placeholder={loadingRegions ? 'Loading...' : 'Select State / Region'}
                                items={regions.map(r => ({ label: r.name, value: r.id }))}
                                onSelect={handleRegionSelect}
                                disabled={!country || loadingRegions}
                            />

                            <CustomPicker
                                label="CITY *"
                                value={city}
                                placeholder={loadingCities ? 'Loading...' : 'Select City'}
                                items={cities.map(c => ({ label: c.name, value: c.name }))}
                                onSelect={(val) => setCity(val)}
                                disabled={!region || loadingCities}
                            />

                            <Text style={styles.label}>VEHICLE PLATE NUMBER *</Text>
                            <TextInput style={styles.input} placeholder="e.g. ABC-123" placeholderTextColor={colors.text3} value={registrationNumber} onChangeText={val => setRegistrationNumber(val.toUpperCase())} autoCapitalize="characters" />

                            <CustomPicker label="VEHICLE TYPE *" value={vehicleType} placeholder="Select Vehicle Type" items={vehicleTypes.map(t => ({ label: t, value: t }))} onSelect={setVehicleType} />

                            <CustomPicker label="FUEL TYPE *" value={fuelType} placeholder="Select Fuel Type" items={fuelTypes.map(t => ({ label: t, value: t }))} onSelect={setFuelType} />

                            <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleRegister} disabled={isLoading} activeOpacity={0.8}>
                                {isLoading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Create Account</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
                                <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const makeStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safeArea: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
    logoIcon: { width: 64, height: 64, backgroundColor: colors.amber, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    title: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.text2, marginTop: 4 },
    formCard: { backgroundColor: colors.bg2, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border },
    label: { fontSize: 11, fontWeight: '600', color: colors.text3, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: colors.bg3, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.text, minHeight: 54, marginBottom: 16, justifyContent: 'center' },
    button: { height: 54, backgroundColor: colors.amber, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.bg, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
    linkContainer: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    linkText: { color: colors.text2, textAlign: 'center', fontSize: 13 },
    linkBold: { color: colors.amber, fontWeight: '700' },
});
