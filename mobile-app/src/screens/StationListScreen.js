import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { stationService } from '../services/api';
import { newTheme } from '../theme/newTheme';

const { width } = Dimensions.get('window');

export default function StationListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'

  useEffect(() => {
    loadStations();
    const interval = setInterval(loadStations, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // Filter stations based on search query
    if (searchQuery.trim() === '') {
      setFilteredStations(stations);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = stations.filter(station => 
        station.name.toLowerCase().includes(query) ||
        station.location?.toLowerCase().includes(query) ||
        station.city?.toLowerCase().includes(query)
      );
      setFilteredStations(filtered);
      if (filtered.length > 0 && !filtered.find(s => s.id === selectedStation?.id)) {
        setSelectedStation(filtered[0]);
      }
    }
  }, [searchQuery, stations]);

  const loadStations = async () => {
    try {
      if (!user || !user.id) {
        console.log('User not loaded yet');
        return;
      }
      const data = await stationService.getByUserLocation(user.id);
      setStations(data);
      setFilteredStations(data);
      if (data.length > 0 && !selectedStation) {
        setSelectedStation(data[0]);
      }
    } catch (error) {
      console.error('Failed to load stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStationPress = (station) => {
    setSelectedStation(station);
  };

  const handleJoinQueue = () => {
    if (selectedStation) {
      navigation.navigate('StationDetails', { station: selectedStation });
    }
  };

  const getQueueColor = (queueLength) => {
    if (queueLength === 0) return newTheme.colors.green;
    if (queueLength < 5) return newTheme.colors.green;
    if (queueLength < 10) return newTheme.colors.amber;
    return newTheme.colors.red;
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
      {/* Map View */}
      <View style={styles.mapContainer}>
        <View style={styles.mapBg} />
        
        {/* Map Grid */}
        <View style={styles.mapGrid} />

        {/* User Location Dot */}
        <View style={styles.userDot} />

        {/* Station Pins */}
        {filteredStations.slice(0, 6).map((station, index) => {
          const positions = [
            { left: '32%', top: '44%' },
            { left: '62%', top: '52%' },
            { left: '80%', top: '30%' },
            { left: '18%', top: '65%' },
            { left: '45%', top: '70%' },
            { left: '70%', top: '60%' },
          ];
          const pos = positions[index] || { left: '50%', top: '50%' };
          const isSelected = selectedStation?.id === station.id;
          const isOpen = station.status === 'OPEN';

          return (
            <TouchableOpacity
              key={station.id}
              style={[styles.stationPin, { left: pos.left, top: pos.top }]}
              onPress={() => handleStationPress(station)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.pinBubble,
                isSelected && styles.pinBubbleSelected,
                !isOpen && styles.pinBubbleClosed
              ]}>
                <View style={[
                  styles.pinDot,
                  isSelected ? styles.pinDotSelected : (isOpen ? styles.pinDotOpen : styles.pinDotClosed)
                ]} />
                <View>
                  <Text style={styles.pinName}>{station.name}</Text>
                  <Text style={styles.pinQueue}>
                    {isOpen ? `${station.currentQueueLength || 0} in queue` : 'Closed'}
                  </Text>
                </View>
              </View>
              <View style={styles.pinTail} />
            </TouchableOpacity>
          );
        })}

        {/* Gradients */}
        <View style={styles.mapGradientTop} />
        <View style={styles.mapGradient} />

        {/* Search Bar */}
        <View style={styles.mapSearch}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a station..."
            placeholderTextColor={newTheme.colors.text3}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Station Info Sheet */}
      <ScrollView style={styles.stationSheet} showsVerticalScrollIndicator={false}>
        {selectedStation ? (
          <>
            <View style={styles.stationSheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stationName}>{selectedStation.name}</Text>
                <View style={styles.stationMeta}>
                  <View style={[
                    styles.pill,
                    selectedStation.status === 'OPEN' ? styles.pillGreen : styles.pillRed
                  ]}>
                    {selectedStation.status === 'OPEN' && <View style={styles.liveDot} />}
                    <Text style={[
                      styles.pillText,
                      { color: selectedStation.status === 'OPEN' ? newTheme.colors.green : newTheme.colors.red }
                    ]}>
                      {selectedStation.status === 'OPEN' ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                  {selectedStation.distance && (
                    <Text style={styles.distanceText}>
                      {selectedStation.distance.toFixed(1)} km
                    </Text>
                  )}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.queueNumber}>{selectedStation.currentQueueLength || 0}</Text>
                <Text style={styles.queueLabel}>in queue</Text>
              </View>
            </View>

            {/* Fuel Types */}
            <View style={styles.fuelChips}>
              {selectedStation.inventory?.map((inv) => (
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

            {/* Actions */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleJoinQueue}
                disabled={selectedStation.status !== 'OPEN'}
                activeOpacity={0.8}
              >
                <Text style={styles.btnPrimaryText}>
                  {selectedStation.status === 'OPEN' ? 'Get Ticket →' : 'Station Closed'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Nearby Stations */}
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>NEARBY STATIONS</Text>
            <View style={styles.nearbyCard}>
              {filteredStations.filter(s => s.id !== selectedStation.id).slice(0, 3).map((station) => (
                <TouchableOpacity
                  key={station.id}
                  style={styles.stationListItem}
                  onPress={() => handleStationPress(station)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.stationIcon,
                    station.status === 'OPEN' ? styles.stationIconOpen : styles.stationIconClosed
                  ]}>
                    <Text style={{ fontSize: 20 }}>
                      {station.status === 'OPEN' ? '⚡' : '⛽'}
                    </Text>
                  </View>
                  <View style={styles.stationListInfo}>
                    <Text style={styles.stationListName}>{station.name}</Text>
                    <Text style={styles.stationListAddr} numberOfLines={1}>
                      {station.location}
                    </Text>
                  </View>
                  <View style={styles.stationListRight}>
                    {station.distance && (
                      <View style={styles.distChip}>
                        <Text style={styles.distChipText}>{station.distance.toFixed(1)} km</Text>
                      </View>
                    )}
                    <View style={[
                      styles.pill,
                      station.currentQueueLength > 5 ? styles.pillAmber : styles.pillGreen,
                      { marginTop: 4 }
                    ]}>
                      <Text style={[
                        styles.pillText,
                        { color: station.currentQueueLength > 5 ? newTheme.colors.amber : newTheme.colors.green }
                      ]}>
                        {station.currentQueueLength || 0} in queue
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No stations available in your area</Text>
          </View>
        )}
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
  mapContainer: {
    height: 320,
    backgroundColor: newTheme.colors.bg2,
    position: 'relative',
    overflow: 'hidden',
  },
  mapBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: newTheme.colors.bg2,
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  userDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: newTheme.colors.blue,
    borderWidth: 3,
    borderColor: newTheme.colors.bg,
    top: '54%',
    left: '48%',
  },
  stationPin: {
    position: 'absolute',
  },
  pinBubble: {
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1.5,
    borderColor: newTheme.colors.border,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinBubbleSelected: {
    borderColor: newTheme.colors.amber,
    backgroundColor: newTheme.colors.amberGlow,
  },
  pinBubbleClosed: {
    borderColor: newTheme.colors.red,
    opacity: 0.7,
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pinDotOpen: {
    backgroundColor: newTheme.colors.green,
  },
  pinDotClosed: {
    backgroundColor: newTheme.colors.red,
  },
  pinDotSelected: {
    backgroundColor: newTheme.colors.amber,
  },
  pinName: {
    fontSize: 11,
    fontWeight: '600',
    color: newTheme.colors.text,
  },
  pinQueue: {
    fontSize: 10,
    color: newTheme.colors.text2,
  },
  pinTail: {
    width: 2,
    height: 10,
    backgroundColor: newTheme.colors.border,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  mapGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'transparent',
  },
  mapGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
  },
  mapSearch: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(19,21,26,0.92)',
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchIcon: {
    fontSize: 16,
    color: newTheme.colors.text3,
  },
  searchInput: {
    fontSize: 14,
    color: newTheme.colors.text,
    flex: 1,
    outlineStyle: 'none',
  },
  clearIcon: {
    fontSize: 18,
    color: newTheme.colors.text3,
    paddingHorizontal: 8,
  },
  stationSheet: {
    flex: 1,
    paddingTop: 20,
  },
  stationSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  stationName: {
    fontSize: 20,
    fontWeight: '700',
    color: newTheme.colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  pillAmber: {
    backgroundColor: newTheme.colors.amberGlow,
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
    fontSize: 12,
    color: newTheme.colors.text3,
  },
  queueNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: newTheme.colors.amber,
  },
  queueLabel: {
    fontSize: 10,
    color: newTheme.colors.text3,
  },
  fuelChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 20,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  btnPrimary: {
    flex: 1,
    height: 54,
    backgroundColor: newTheme.colors.amber,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: newTheme.colors.bg,
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: newTheme.colors.border,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: newTheme.colors.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  nearbyCard: {
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 16,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  stationListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: newTheme.colors.border,
  },
  stationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationIconOpen: {
    backgroundColor: newTheme.colors.greenGlow,
  },
  stationIconClosed: {
    backgroundColor: 'rgba(248,113,113,0.1)',
  },
  stationListInfo: {
    flex: 1,
  },
  stationListName: {
    fontSize: 14,
    fontWeight: '600',
    color: newTheme.colors.text,
    marginBottom: 2,
  },
  stationListAddr: {
    fontSize: 12,
    color: newTheme.colors.text3,
  },
  stationListRight: {
    alignItems: 'flex-end',
  },
  distChip: {
    backgroundColor: newTheme.colors.bg3,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  distChipText: {
    fontSize: 11,
    color: newTheme.colors.text3,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: newTheme.colors.text3,
  },
});
