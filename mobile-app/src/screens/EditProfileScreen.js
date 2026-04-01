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
import { newTheme } from '../theme/newTheme';

export default function EditProfileScreen({ navigation }) {
  const { user, setUser } = useContext(AuthContext);
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [country, setCountry] = useState(user.country || '');
  const [region, setRegion] = useState(user.region || '');
  const [city, setCity] = useState(user.city || '');
  
  const [locations, setLocations] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await lookupService.getLocations();
      setLocations(data);
      
      if (user.country) {
        const selectedCountry = data.find(c => c.name === user.country);
        if (selectedCountry) {
          await loadRegions(selectedCountry.id);
          
          if (user.region) {
            // We'll load cities after regions are loaded
          }
        }
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async (countryId) => {
    try {
      const data = await lookupService.getRegionsByCountry(countryId);
      setRegions(data);
      
      // If user already has a region selected, load cities for it
      if (user.region) {
        const selectedRegion = data.find(r => r.name === user.region);
        if (selectedRegion) {
          await loadCities(selectedRegion.id);
        }
      }
    } catch (error) {
      console.error('Failed to load regions:', error);
    }
  };

  const loadCities = async (regionId) => {
    try {
      const data = await lookupService.getCitiesByRegion(regionId);
      setCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const handleCountryChange = async (countryName) => {
    console.log('Country selected:', countryName);
    setCountry(countryName);
    setRegion('');
    setCity('');
    setCities([]);
    setRegions([]);
    setShowCountryPicker(false);
    
    const selectedCountry = locations.find(c => c.name === countryName);
    console.log('Selected country:', selectedCountry);
    
    if (selectedCountry) {
      await loadRegions(selectedCountry.id);
    }
  };

  const handleRegionChange = async (regionName) => {
    console.log('Region selected:', regionName);
    setRegion(regionName);
    setCity('');
    setCities([]);
    setShowRegionPicker(false);
    
    const selectedRegion = regions.find(r => r.name === regionName);
    console.log('Selected region:', selectedRegion);
    
    if (selectedRegion) {
      await loadCities(selectedRegion.id);
    }
  };
  
  const handleCityChange = (cityName) => {
    setCity(cityName);
    setShowCityPicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      const msg = 'Name is required';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    if (!country || !region || !city) {
      const msg = 'Please select country, region, and city';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    setSaving(true);
    try {
      const response = await authService.updateProfile({ name, phone, country, region, city });
      setUser(response.user);

      const successMsg = 'Profile updated successfully!';
      if (Platform.OS === 'web') {
        window.alert(successMsg);
        navigation.goBack();
      } else {
        Alert.alert('Success', successMsg, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update profile';
      Platform.OS === 'web' ? window.alert(errorMsg) : Alert.alert('Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={newTheme.colors.amber} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={newTheme.colors.text3}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Email (Read-only) */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>EMAIL (CANNOT BE CHANGED)</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.inputDisabledText}>{user.email}</Text>
          </View>
        </View>

        {/* Phone */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>PHONE</Text>
          <TextInput
            style={styles.input}
            placeholder="+27 XX XXX XXXX"
            placeholderTextColor={newTheme.colors.text3}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Country */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>COUNTRY</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCountryPicker(!showCountryPicker)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectButtonText, !country && styles.selectButtonPlaceholder]}>
              {country || 'Select Country'}
            </Text>
            <Text style={styles.selectButtonArrow}>{showCountryPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showCountryPicker && (
            <View style={styles.selectDropdown}>
              <ScrollView style={styles.selectScrollView} nestedScrollEnabled={true}>
                <View style={styles.selectList}>
                  {locations.map((loc) => (
                    <TouchableOpacity
                      key={loc.id}
                      style={[
                        styles.selectListItem,
                        country === loc.name && styles.selectListItemActive
                      ]}
                      onPress={() => handleCountryChange(loc.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.selectListText}>{loc.name}</Text>
                      {country === loc.name && (
                        <Text style={styles.checkMark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Region */}
        {country && (
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>PROVINCE</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowRegionPicker(!showRegionPicker)}
              activeOpacity={0.7}
            >
              <Text style={[styles.selectButtonText, !region && styles.selectButtonPlaceholder]}>
                {region || 'Select Province'}
              </Text>
              <Text style={styles.selectButtonArrow}>{showRegionPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showRegionPicker && (
              <View style={styles.selectDropdown}>
                <ScrollView style={styles.selectScrollView} nestedScrollEnabled={true}>
                  <View style={styles.selectList}>
                    {regions.length === 0 ? (
                      <View style={styles.selectListItem}>
                        <Text style={styles.selectListText}>Loading regions...</Text>
                      </View>
                    ) : (
                      regions.map((reg) => (
                        <TouchableOpacity
                          key={reg.id}
                          style={[
                            styles.selectListItem,
                            region === reg.name && styles.selectListItemActive
                          ]}
                          onPress={() => handleRegionChange(reg.name)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.selectListText}>{reg.name}</Text>
                          {region === reg.name && (
                            <Text style={styles.checkMark}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* City */}
        {region && (
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>CITY</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowCityPicker(!showCityPicker)}
              activeOpacity={0.7}
            >
              <Text style={[styles.selectButtonText, !city && styles.selectButtonPlaceholder]}>
                {city || 'Select City'}
              </Text>
              <Text style={styles.selectButtonArrow}>{showCityPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showCityPicker && (
              <View style={styles.selectDropdown}>
                <ScrollView style={styles.selectScrollView} nestedScrollEnabled={true}>
                  <View style={styles.selectList}>
                    {cities.length === 0 ? (
                      <View style={styles.selectListItem}>
                        <Text style={styles.selectListText}>Loading cities...</Text>
                      </View>
                    ) : (
                      cities.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.selectListItem,
                            city === c.name && styles.selectListItemActive
                          ]}
                          onPress={() => handleCityChange(c.name)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.selectListText}>{c.name}</Text>
                          {city === c.name && (
                            <Text style={styles.checkMark}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Save Button */}
        <View style={styles.actionArea}>
          <TouchableOpacity
            style={[styles.btnPrimary, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={newTheme.colors.bg} />
            ) : (
              <Text style={styles.btnPrimaryText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: newTheme.colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: newTheme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: newTheme.colors.text,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: newTheme.colors.text,
  },
  scrollArea: {
    flex: 1,
  },
  formGroup: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: newTheme.colors.text3,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
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
  inputDisabled: {
    opacity: 0.6,
    justifyContent: 'center',
  },
  inputDisabledText: {
    fontSize: 15,
    color: newTheme.colors.text3,
  },
  selectButton: {
    height: 54,
    backgroundColor: newTheme.colors.bg3,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonText: {
    fontSize: 15,
    color: newTheme.colors.text,
    fontWeight: '500',
  },
  selectButtonPlaceholder: {
    color: newTheme.colors.text3,
  },
  selectButtonArrow: {
    fontSize: 12,
    color: newTheme.colors.text3,
  },
  selectDropdown: {
    marginTop: 8,
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectScrollView: {
    maxHeight: 200,
  },
  selectList: {
    padding: 8,
    gap: 6,
  },
  selectListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: newTheme.colors.bg3,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 8,
    padding: 12,
  },
  selectListItemActive: {
    borderColor: newTheme.colors.amber,
    backgroundColor: newTheme.colors.amberGlow,
  },
  selectListText: {
    fontSize: 14,
    fontWeight: '500',
    color: newTheme.colors.text,
  },
  checkMark: {
    fontSize: 16,
    color: newTheme.colors.amber,
    fontWeight: '700',
  },
  actionArea: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  btnPrimary: {
    height: 54,
    backgroundColor: newTheme.colors.amber,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: newTheme.colors.bg,
    letterSpacing: -0.2,
  },
});
