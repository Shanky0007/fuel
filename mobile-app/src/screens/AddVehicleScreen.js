import React, { useState, useEffect } from 'react';
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
import { vehicleService } from '../services/api';
import { newTheme } from '../theme/newTheme';

export default function AddVehicleScreen({ navigation }) {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [fuelTypeId, setFuelTypeId] = useState('');
  const [fuelTypes, setFuelTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const vehicleTypes = ['Car', 'Motorcycle', 'Truck', 'Bus'];

  useEffect(() => {
    loadFuelTypes();
  }, []);

  const loadFuelTypes = async () => {
    try {
      const data = await vehicleService.getFuelTypes();
      setFuelTypes(data);
    } catch (error) {
      console.error('Failed to load fuel types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!registrationNumber.trim()) {
      const msg = 'Please enter registration number';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    if (!vehicleType) {
      const msg = 'Please select vehicle type';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    if (!fuelTypeId) {
      const msg = 'Please select fuel type';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    setSaving(true);
    try {
      await vehicleService.create({
        registrationNumber: registrationNumber.toUpperCase(),
        licensePlate: registrationNumber.toUpperCase(),
        type: vehicleType,
        fuelTypeId: parseInt(fuelTypeId),
      });

      const successMsg = 'Vehicle added successfully!';
      if (Platform.OS === 'web') {
        window.alert(successMsg);
        navigation.goBack();
      } else {
        Alert.alert('Success', successMsg, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Failed to add vehicle:', error);
      const errorMsg = error.response?.data?.error || 'Failed to add vehicle';
      Platform.OS === 'web' ? window.alert(errorMsg) : Alert.alert('Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'Car': return '🚗';
      case 'Motorcycle': return '🏍';
      case 'Truck': return '🚛';
      case 'Bus': return '🚌';
      default: return '🚗';
    }
  };

  const getFuelIcon = (name) => {
    switch (name) {
      case 'Petrol': return '🔴';
      case 'Diesel': return '🟡';
      case 'EV': return '⚡';
      case 'CNG': return '🔵';
      default: return '⛽';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
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
        <Text style={styles.headerTitle}>Add Vehicle</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Registration Number */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>REGISTRATION NUMBER</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., ABC-123-GP"
            placeholderTextColor={newTheme.colors.text3}
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            autoCapitalize="characters"
          />
        </View>

        {/* Vehicle Type */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>VEHICLE TYPE</Text>
          <View style={styles.selectGrid}>
            {vehicleTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.selectItem,
                  vehicleType === type && styles.selectItemActive
                ]}
                onPress={() => setVehicleType(type)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectIcon}>{getVehicleIcon(type)}</Text>
                <Text style={[
                  styles.selectText,
                  vehicleType === type && styles.selectTextActive
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fuel Type */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>FUEL TYPE</Text>
          <View style={styles.fuelList}>
            {fuelTypes.map((fuel) => (
              <TouchableOpacity
                key={fuel.id}
                style={[
                  styles.fuelItem,
                  fuelTypeId === fuel.id.toString() && styles.fuelItemActive
                ]}
                onPress={() => setFuelTypeId(fuel.id.toString())}
                activeOpacity={0.7}
              >
                <Text style={styles.fuelItemIcon}>{getFuelIcon(fuel.name)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fuelItemName}>{fuel.name}</Text>
                </View>
                <View style={[
                  styles.checkCircle,
                  fuelTypeId === fuel.id.toString() && styles.checkCircleActive
                ]}>
                  {fuelTypeId === fuel.id.toString() && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
              <Text style={styles.btnPrimaryText}>Save Vehicle</Text>
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
    marginBottom: 24,
  },
  formLabel: {
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
    fontWeight: '600',
    letterSpacing: 2,
  },
  selectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectItem: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1.5,
    borderColor: newTheme.colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  selectItemActive: {
    borderColor: newTheme.colors.amber,
    backgroundColor: newTheme.colors.amberGlow,
  },
  selectIcon: {
    fontSize: 32,
  },
  selectText: {
    fontSize: 13,
    fontWeight: '600',
    color: newTheme.colors.text2,
  },
  selectTextActive: {
    color: newTheme.colors.text,
  },
  fuelList: {
    gap: 8,
  },
  fuelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1.5,
    borderColor: newTheme.colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  fuelItemActive: {
    borderColor: newTheme.colors.amber,
    backgroundColor: newTheme.colors.amberGlow,
  },
  fuelItemIcon: {
    fontSize: 24,
  },
  fuelItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: newTheme.colors.text,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: newTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: newTheme.colors.amber,
    borderColor: newTheme.colors.amber,
  },
  checkMark: {
    fontSize: 12,
    color: newTheme.colors.bg,
    fontWeight: '700',
  },
  actionArea: {
    paddingHorizontal: 20,
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
