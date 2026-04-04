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
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { vehicleService, authService } from '../services/api';
import { newTheme } from '../theme/newTheme';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVisits: 0,
    stationsVisited: 0,
    totalFuel: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vehiclesData, statsData] = await Promise.all([
        vehicleService.getAll(),
        authService.getMyStats().catch(() => ({ totalVisits: 0, stationsVisited: 0, totalFuel: 0 })),
      ]);
      setVehicles(vehiclesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    const confirmDelete = () => {
      Alert.alert(
        'Delete Vehicle',
        'Are you sure you want to delete this vehicle?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await vehicleService.delete(vehicleId);
                loadData();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete vehicle');
              }
            },
          },
        ]
      );
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this vehicle?')) {
        try {
          await vehicleService.delete(vehicleId);
          loadData();
        } catch (error) {
          window.alert('Failed to delete vehicle');
        }
      }
    } else {
      confirmDelete();
    }
  };

  const handleLogout = () => {
    const confirmLogout = () => {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: logout,
          },
        ]
      );
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        logout();
      }
    } else {
      confirmLogout();
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

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
      <View style={styles.header}>
        <Text style={styles.h1}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={{ fontSize: 16 }}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </View>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileRole}>
            Customer{user.createdAt ? ` · Member since ${new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statVal}>{stats.totalVisits}</Text>
            <Text style={styles.statLbl}>Visits</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statVal}>{stats.stationsVisited}</Text>
            <Text style={styles.statLbl}>Stations</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statVal}>{stats.totalFuel}L</Text>
            <Text style={styles.statLbl}>Fuel Used</Text>
          </View>
        </View>

        {/* Vehicles */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY VEHICLES</Text>
          {vehicles.map((vehicle, index) => (
            <View key={vehicle.id} style={styles.vehicleCard}>
              <Text style={styles.vehicleIcon}>{getVehicleIcon(vehicle.type)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehiclePlate}>{vehicle.registrationNumber}</Text>
                <Text style={styles.vehicleType}>
                  {vehicle.type} · {vehicle.fuelType?.name || 'Unknown'}
                </Text>
              </View>
              {index === 0 && (
                <View style={[styles.pill, styles.pillAmber]}>
                  <Text style={[styles.pillText, { color: newTheme.colors.amber }]}>
                    Primary
                  </Text>
                </View>
              )}
              {index > 0 && (
                <TouchableOpacity
                  onPress={() => handleDeleteVehicle(vehicle.id)}
                  style={styles.deleteBtn}
                >
                  <Text style={{ fontSize: 16 }}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            style={styles.btnGhost}
            onPress={() => navigation.navigate('AddVehicle')}
          >
            <Text style={styles.btnGhostText}>+ Add Vehicle</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(96,165,250,0.12)' }]}>
              <Text style={{ fontSize: 17 }}>👤</Text>
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Edit Profile</Text>
              <Text style={styles.menuSub}>Name, phone, location</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { marginTop: 8 }]}
            onPress={handleLogout}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(248,113,113,0.1)' }]}>
              <Text style={{ fontSize: 17 }}>🚪</Text>
            </View>
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: newTheme.colors.red }]}>
                Logout
              </Text>
            </View>
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
    paddingTop: 4,
    paddingBottom: 16,
  },
  h1: {
    fontSize: 26,
    fontWeight: '700',
    color: newTheme.colors.text,
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    backgroundColor: newTheme.colors.bg3,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  profileHero: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: newTheme.colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: 'white',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: newTheme.colors.text,
  },
  profileRole: {
    fontSize: 12,
    color: newTheme.colors.text3,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: newTheme.colors.border,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '700',
    color: newTheme.colors.amber,
  },
  statLbl: {
    fontSize: 10,
    color: newTheme.colors.text3,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: newTheme.colors.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: newTheme.colors.bg3,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  vehicleIcon: {
    fontSize: 26,
  },
  vehiclePlate: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    color: newTheme.colors.amber,
  },
  vehicleType: {
    fontSize: 11,
    color: newTheme.colors.text3,
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pillAmber: {
    backgroundColor: newTheme.colors.amberGlow,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
  btnGhost: {
    height: 44,
    backgroundColor: newTheme.colors.bg3,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnGhostText: {
    fontSize: 13,
    fontWeight: '500',
    color: newTheme.colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: newTheme.colors.text,
  },
  menuSub: {
    fontSize: 12,
    color: newTheme.colors.text3,
  },
  menuStatus: {
    fontSize: 13,
    fontWeight: '500',
    color: newTheme.colors.green,
  },
  menuArrow: {
    fontSize: 14,
    color: newTheme.colors.text3,
  },
});
