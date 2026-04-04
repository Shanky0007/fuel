import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { stationService } from '../services/api';
import { newTheme } from '../theme/newTheme';

export default function StationListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // distance, queue, name

  useEffect(() => {
    loadStations();
    const interval = setInterval(loadStations, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    let list = [...stations];

    // Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.region?.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      }
      if (sortBy === 'queue') return (a.currentQueueLength || 0) - (b.currentQueueLength || 0);
      return a.name.localeCompare(b.name);
    });

    setFilteredStations(list);
  }, [searchQuery, stations, sortBy]);

  const loadStations = async () => {
    try {
      if (!user || !user.id) return;
      const data = await stationService.getByUserLocation(user.id);
      setStations(data);
    } catch (error) {
      console.error('Failed to load stations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStations();
  };

  const openCount = stations.filter(s => s.status === 'OPEN').length;

  const renderStation = ({ item: station }) => {
    const isOpen = station.status === 'OPEN';
    const queueLen = station.currentQueueLength || 0;
    const queueColor = queueLen === 0 ? newTheme.colors.green : queueLen < 5 ? newTheme.colors.green : queueLen < 10 ? newTheme.colors.amber : newTheme.colors.red;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('StationDetails', { station })}
        activeOpacity={0.7}
      >
        {/* Top row: name + status */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{station.name}</Text>
            <Text style={styles.cardAddr} numberOfLines={1}>
              {[station.location, station.city, station.region].filter(Boolean).join(' · ') || 'No address'}
            </Text>
          </View>
          <View style={[styles.statusPill, isOpen ? styles.statusOpen : styles.statusClosed]}>
            {isOpen && <View style={styles.statusDot} />}
            <Text style={[styles.statusText, { color: isOpen ? newTheme.colors.green : newTheme.colors.red }]}>
              {isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: queueColor }]}>{queueLen}</Text>
            <Text style={styles.statLabel}>In Queue</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{station.totalPumps || 0}</Text>
            <Text style={styles.statLabel}>Pumps</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>~{queueLen * 2}m</Text>
            <Text style={styles.statLabel}>Wait</Text>
          </View>
          {station.distance != null && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{station.distance.toFixed(1)}</Text>
                <Text style={styles.statLabel}>km</Text>
              </View>
            </>
          )}
        </View>

        {/* Fuel chips */}
        {station.inventory?.length > 0 && (
          <View style={styles.fuelRow}>
            {station.inventory.map(inv => (
              <View key={inv.id} style={styles.fuelChip}>
                <Text style={styles.fuelChipText}>
                  {inv.fuelType?.name === 'Petrol' ? '🔴' : inv.fuelType?.name === 'Diesel' ? '🟡' : inv.fuelType?.name === 'EV' ? '⚡' : '🔵'}
                  {' '}{inv.fuelType?.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick action */}
        {isOpen && (
          <View style={styles.cardAction}>
            <Text style={styles.cardActionText}>Get Ticket →</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={newTheme.colors.amber} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={newTheme.colors.bg} />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Stations</Text>
          <Text style={styles.headerSub}>
            {user?.city ? `${user.city}, ${user.region}` : user?.region || 'Your area'} · {openCount} open
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{stations.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stations..."
          placeholderTextColor={newTheme.colors.text3}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort chips */}
      <View style={styles.sortRow}>
        {[
          { key: 'distance', label: 'Nearest' },
          { key: 'queue', label: 'Shortest Queue' },
          { key: 'name', label: 'A-Z' },
        ].map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sortChip, sortBy === s.key && styles.sortChipActive]}
            onPress={() => setSortBy(s.key)}
          >
            <Text style={[styles.sortChipText, sortBy === s.key && styles.sortChipTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Station list */}
      <FlatList
        data={filteredStations}
        keyExtractor={item => item.id}
        renderItem={renderStation}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[newTheme.colors.amber]} tintColor={newTheme.colors.amber} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>⛽</Text>
            <Text style={styles.emptyTitle}>No stations found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search' : 'No stations available in your area yet'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: newTheme.colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: newTheme.colors.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: newTheme.colors.text2,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: newTheme.colors.amberGlow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 16,
    fontWeight: '800',
    color: newTheme.colors.amber,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: newTheme.colors.text,
  },
  clearBtn: {
    fontSize: 16,
    color: newTheme.colors.text3,
    paddingHorizontal: 4,
  },

  // Sort
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
  },
  sortChipActive: {
    backgroundColor: newTheme.colors.amberGlow,
    borderColor: newTheme.colors.amber,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: newTheme.colors.text2,
  },
  sortChipTextActive: {
    color: newTheme.colors.amber,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: newTheme.colors.bg2,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 18,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: newTheme.colors.text,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  cardAddr: {
    fontSize: 12,
    color: newTheme.colors.text3,
  },

  // Status pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    marginLeft: 10,
    flexShrink: 0,
  },
  statusOpen: {
    backgroundColor: newTheme.colors.greenGlow,
  },
  statusClosed: {
    backgroundColor: 'rgba(248,113,113,0.12)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: newTheme.colors.green,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: newTheme.colors.bg3,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: newTheme.colors.text,
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 10,
    color: newTheme.colors.text3,
  },
  statDivider: {
    width: 1,
    backgroundColor: newTheme.colors.border,
    marginVertical: 2,
  },

  // Fuel chips
  fuelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  fuelChip: {
    backgroundColor: newTheme.colors.bg3,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  fuelChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: newTheme.colors.text2,
  },

  // Card action
  cardAction: {
    backgroundColor: newTheme.colors.amber,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: newTheme.colors.bg,
    letterSpacing: -0.2,
  },

  // Empty
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: newTheme.colors.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: newTheme.colors.text3,
  },
});
