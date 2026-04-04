import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { lookupService, authService } from '../services/api';
import { useTheme } from '../theme/useTheme';
import CustomPicker from '../components/CustomPicker';

export default function EditProfileScreen({ navigation }) {
  const colors = useTheme();
  const styles = makeStyles(colors);

  const { user, setUser } = useContext(AuthContext);
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [region, setRegion] = useState(user.region || '');
  const [city, setCity] = useState(user.city || '');

  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const data = await lookupService.getSouthAfricaRegions();
      setRegions(data);
      if (user.region) {
        const selected = data.find(r => r.name === user.region);
        if (selected) await loadCities(selected.id);
      }
    } catch (error) {
      console.error('Failed to load regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async (regionId) => {
    setLoadingCities(true);
    try {
      const data = await lookupService.getCitiesByRegion(regionId);
      setCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleRegionSelect = async (regionId) => {
    const r = regions.find(r => r.id === regionId);
    setRegion(r ? r.name : '');
    setCity('');
    setCities([]);
    await loadCities(regionId);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      const msg = 'Name is required';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }
    if (!region || !city) {
      const msg = 'Please select region and city';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    setSaving(true);
    try {
      const response = await authService.updateProfile({ name, phone, country: 'South Africa', region, city });
      setUser(response.user);
      const msg = 'Profile updated successfully!';
      if (Platform.OS === 'web') {
        window.alert(msg);
        navigation.goBack();
      } else {
        Alert.alert('Success', msg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to update profile';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.amber} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.text3}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>EMAIL (CANNOT BE CHANGED)</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.inputDisabledText}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>PHONE</Text>
          <TextInput
            style={styles.input}
            placeholder="+27 XX XXX XXXX"
            placeholderTextColor={colors.text3}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Country - static */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>COUNTRY</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.inputDisabledText}>South Africa</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <CustomPicker
            label="PROVINCE"
            value={region}
            placeholder="Select Province"
            items={regions.map(r => ({ label: r.name, value: r.id }))}
            onSelect={handleRegionSelect}
          />
        </View>

        <View style={styles.formGroup}>
          <CustomPicker
            label="CITY"
            value={city}
            placeholder={loadingCities ? 'Loading...' : 'Select City'}
            items={cities.map(c => ({ label: c.name, value: c.name }))}
            onSelect={setCity}
            disabled={!region || loadingCities}
          />
        </View>

        <View style={[styles.formGroup, styles.actionArea]}>
          <TouchableOpacity
            style={[styles.btnPrimary, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color={colors.bg} />
              : <Text style={styles.btnPrimaryText}>Save Changes</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
  },
  backBtn: {
    width: 44, height: 44, backgroundColor: colors.bg2, borderWidth: 1,
    borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.text },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  scrollArea: { flex: 1 },
  formGroup: { paddingHorizontal: 20, marginBottom: 20 },
  formLabel: {
    fontSize: 11, fontWeight: '600', color: colors.text3,
    letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase',
  },
  input: {
    height: 54, backgroundColor: colors.bg3, borderWidth: 1,
    borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16,
    fontSize: 15, color: colors.text, justifyContent: 'center',
  },
  inputDisabled: { opacity: 0.5 },
  inputDisabledText: { fontSize: 15, color: colors.text2 },
  actionArea: { marginTop: 8 },
  btnPrimary: {
    height: 54, backgroundColor: colors.amber, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: colors.bg, letterSpacing: -0.2 },
});
