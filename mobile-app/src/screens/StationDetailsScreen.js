import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { queueService, vehicleService } from '../services/api';
import { newTheme } from '../theme/newTheme';

export default function StationDetailsScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const { station } = route.params;
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
      if (data.length > 0) {
        setSelectedVehicle(data[0]);
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQueue = async () => {
    if (!selectedVehicle) {
      const msg = 'Please select a vehicle';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
      return;
    }

    setJoining(true);
    try {
      await queueService.joinQueue({
        stationId: station.id,
        vehicleId: selectedVehicle.id,
      });

      const successMsg = 'Successfully joined the queue!';
      if (Platform.OS === 'web') {
        window.alert(successMsg);
        navigation.navigate('MainTabs', { screen: 'Ticket' });
      } else {
        Alert.alert('Success', successMsg, [
          {
            text: 'View Ticket',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Ticket' }),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to join queue:', error);
      const errorMsg = error.response?.data?.error || 'Failed to join queue';
      
      if (errorMsg.includes('ALREADY_IN_QUEUE')) {
        if (Platform.OS === 'web') {
          window.alert('You are already in a queue. Please complete or cancel your current ticket first.');
          navigation.navigate('MainTabs', { screen: 'Ticket' });
        } else {
          Alert.alert(
            'Already in Queue',
            'You are already in a queue. Please complete or cancel your current ticket first.',
            [
              {
                text: 'View Ticket',
                onPress: () => navigation.navigate('MainTabs', { screen: 'Ticket' }),
              },
            ]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(errorMsg);
        } else {
          Alert.alert('Error', errorMsg);
        }
      }
    } finally {
      setJoining(false);
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={newTheme.colors.bg} />
        <ActivityIndicator size="large" color={newTheme.colors.amber} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={newTheme.colors.bg} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Station Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Station Info */}
        <View style={styles.stationCard}>
          <View style={styles.stationHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stationName}>{station.name}</Text>
              {station.location && <Text style={styles.stationLocation}>{station.location}</Text>}
              <Text style={styles.stationCity}>
                {[station.city, station.region, station.country].filter(Boolean).join(', ') || 'No location'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[
                styles.pill,
                station.status === 'OPEN' ? styles.pillGreen : styles.pillRed
              ]}>
                {station.status === 'OPEN' && <View style={styles.liveDot} />}
                <Text style={[
                  styles.pillText,
                  { color: station.status === 'OPEN' ? newTheme.colors.green : newTheme.colors.red }
                ]}>
                  {station.status}
                </Text>
              </View>
              {station.distance && (
                <Text style={styles.distanceText}>
                  {station.distance.toFixed(1)} km away
                </Text>
              )}
            </View>
          </View>

          {/* Queue Info */}
          <View style={styles.queueInfo}>
            <View style={styles.queueInfoItem}>
              <Text style={styles.queueInfoVal}>{station.currentQueueLength || 0}</Text>
              <Text style={styles.queueInfoLabel}>In Queue</Text>
            </View>
            <View style={styles.queueInfoItem}>
              <Text style={styles.queueInfoVal}>{station.totalPumps || 0}</Text>
              <Text style={styles.queueInfoLabel}>Pumps</Text>
            </View>
            <View style={styles.queueInfoItem}>
              <Text style={styles.queueInfoVal}>
                ~{(station.currentQueueLength || 0) * 2}
              </Text>
              <Text style={styles.queueInfoLabel}>Wait (min)</Text>
            </View>
          </View>

          {/* Fuel Types */}
          {station.inventory && station.inventory.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>AVAILABLE FUEL</Text>
              <View style={styles.fuelChips}>
                {station.inventory.map((inv) => (
                  <View key={inv.id} style={styles.fuelChip}>
                    <Text style={styles.fuelChipText}>
                      {inv.fuelType?.name === 'Petrol' && '🔴'}
                      {inv.fuelType?.name === 'Diesel' && '🟡'}
                      {inv.fuelType?.name === 'EV' && '⚡'}
                      {inv.fuelType?.name === 'CNG' && '🔵'}
                      {' '}{inv.fuelType?.name}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Vehicle Selection */}
        <Text style={[styles.sectionLabel, { paddingHorizontal: 20 }]}>
          SELECT YOUR VEHICLE
        </Text>
        <View style={styles.vehicleList}>
          {vehicles.length === 0 ? (
            <View style={styles.emptyVehicles}>
              <Text style={styles.emptyText}>No vehicles registered</Text>
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() => navigation.navigate('AddVehicle')}
              >
                <Text style={styles.btnGhostText}>+ Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleItem,
                  selectedVehicle?.id === vehicle.id && styles.vehicleItemSelected
                ]}
                onPress={() => setSelectedVehicle(vehicle)}
                activeOpacity={0.7}
              >
                <Text style={styles.vehicleIcon}>{getVehicleIcon(vehicle.type)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vehiclePlate}>{vehicle.registrationNumber}</Text>
                  <Text style={styles.vehicleType}>
                    {vehicle.type} · {vehicle.fuelType?.name}
                  </Text>
                </View>
                <View style={[
                  styles.radioBtn,
                  selectedVehicle?.id === vehicle.id && styles.radioBtnSelected
                ]}>
                  {selectedVehicle?.id === vehicle.id && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Join Button */}
        <View style={styles.actionArea}>
          <TouchableOpacity
            style={[
              styles.btnPrimary,
              (station.status !== 'OPEN' || !selectedVehicle || joining) && styles.btnDisabled
            ]}
            onPress={handleJoinQueue}
            disabled={station.status !== 'OPEN' || !selectedVehicle || joining}
            activeOpacity={0.8}
          >
            {joining ? (
              <ActivityIndicator color={newTheme.colors.bg} />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {station.status === 'OPEN' ? 'Join Queue →' : 'Station Closed'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
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
  stationCard: {
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stationName: {
    fontSize: 20,
    fontWeight: '700',
    color: newTheme.colors.text,
    marginBottom: 4,
  },
  stationLocation: {
    fontSize: 13,
    color: newTheme.colors.text2,
    marginBottom: 2,
  },
  stationCity: {
    fontSize: 12,
    color: newTheme.colors.text3,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
  },
  pillGreen: {
    backgroundColor: newTheme.colors.greenGlow,
  },
  pillRed: {
    backgroundColor: 'rgba(248,113,113,0.12)',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: newTheme.colors.green,
  },
  distanceText: {
    fontSize: 11,
    color: newTheme.colors.text3,
    marginTop: 4,
  },
  queueInfo: {
    flexDirection: 'row',
    backgroundColor: newTheme.colors.bg3,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  queueInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  queueInfoVal: {
    fontSize: 20,
    fontWeight: '700',
    color: newTheme.colors.amber,
    marginBottom: 2,
  },
  queueInfoLabel: {
    fontSize: 10,
    color: newTheme.colors.text3,
  },
  divider: {
    height: 1,
    backgroundColor: newTheme.colors.border,
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: newTheme.colors.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  fuelChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  fuelChip: {
    backgroundColor: newTheme.colors.bg3,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  fuelChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: newTheme.colors.text2,
  },
  vehicleList: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1.5,
    borderColor: newTheme.colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  vehicleItemSelected: {
    borderColor: newTheme.colors.amber,
    backgroundColor: newTheme.colors.amberGlow,
  },
  vehicleIcon: {
    fontSize: 24,
  },
  vehiclePlate: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    color: newTheme.colors.text,
  },
  vehicleType: {
    fontSize: 11,
    color: newTheme.colors.text3,
    marginTop: 2,
  },
  radioBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: newTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioBtnSelected: {
    borderColor: newTheme.colors.amber,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: newTheme.colors.amber,
  },
  emptyVehicles: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: newTheme.colors.text3,
    marginBottom: 12,
  },
  btnGhost: {
    height: 44,
    backgroundColor: newTheme.colors.bg3,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    fontSize: 13,
    fontWeight: '500',
    color: newTheme.colors.text,
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
