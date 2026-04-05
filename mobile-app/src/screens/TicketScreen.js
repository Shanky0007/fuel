import React, { useState, useCallback } from 'react';
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
import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect } from '@react-navigation/native';
import { newTheme, commonStyles } from '../theme/newTheme';
import { queueService } from '../services/api';

export default function TicketScreen({ route, navigation }) {
  const [queueData, setQueueData] = useState(route.params || null);
  const [loading, setLoading] = useState(!route.params);
  const [ticketInfo, setTicketInfo] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadMyQueue();
    }, [])
  );

  const loadMyQueue = async () => {
    try {
      setLoading(true);
      const data = await queueService.getMyQueue();
      if (data && data.ticket) {
        setQueueData(data);
        if (data.ticket.qrCodeData) {
          try {
            setTicketInfo(JSON.parse(data.ticket.qrCodeData));
          } catch (e) {
            console.error('Error parsing ticket qr data', e);
          }
        }
      } else {
        setQueueData(null);
        setTicketInfo(null);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load queue status', error);
      }
      setQueueData(null);
      setTicketInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQueue = () => {
    const confirmLeave = () => {
      Alert.alert(
        'Leave Queue',
        'Are you sure you want to leave the queue? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: executeLeave,
          },
        ]
      );
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to leave the queue? This cannot be undone.')) {
        executeLeave();
      }
    } else {
      confirmLeave();
    }
  };

  const executeLeave = async () => {
    try {
      setLoading(true);
      await queueService.leaveQueue();
      setQueueData(null);
      setTicketInfo(null);
      // If on web, use window alert
      if (Platform.OS === 'web') {
        window.alert('You have left the queue.');
      } else {
        Alert.alert('Success', 'You have left the queue.');
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Failed to leave queue.');
      } else {
        Alert.alert('Error', 'Failed to leave queue.');
      }
    } finally {
      setLoading(false);
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

  if (!queueData || !queueData.ticket) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <StatusBar barStyle="light-content" backgroundColor={newTheme.colors.bg} />
        <Text style={{ fontSize: 60, marginBottom: 20 }}>🎫</Text>
        <Text style={[styles.h2, { textAlign: 'center', marginBottom: 10 }]}>No Active Ticket</Text>
        <Text style={[styles.body, { textAlign: 'center', marginBottom: 30 }]}>
          You are not currently in any queue. Browse stations to join a queue.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('StationList')}
        >
          <Text style={styles.primaryBtnText}>Browse Stations</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { ticket, position, queue } = queueData;
  const station = queue?.station;
  const vehicle = queue?.vehicle;
  const isServing = queue?.status === 'SERVING';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={newTheme.colors.bg} />
      <View style={styles.header}>
        <Text style={styles.h1}>My Ticket</Text>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Status banner */}
        <View style={[styles.statusBanner, isServing ? styles.statusServing : styles.statusWaiting]}>
          <View style={[styles.statusDot, { backgroundColor: isServing ? newTheme.colors.green : newTheme.colors.amber }]} />
          <Text style={[styles.statusBannerText, { color: isServing ? newTheme.colors.green : newTheme.colors.amber }]}>
            {isServing ? 'You are being served' : 'Waiting in queue'}
          </Text>
        </View>

        <View style={styles.ticketCard}>
          {/* QR + Code */}
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <QRCode
                value={ticket?.qrCodeData || 'No data'}
                size={200}
                color={newTheme.colors.bg2}
                backgroundColor={newTheme.colors.white}
              />
            </View>

            <View style={styles.verificationContainer}>
              <Text style={styles.verificationLabel}>Verification Code</Text>
              <View style={styles.verificationCodeBox}>
                <Text style={styles.verificationCode}>
                  {ticket?.verificationCode || '------'}
                </Text>
              </View>
              <Text style={styles.verificationHint}>
                Show this to the operator
              </Text>
            </View>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
          </View>

          {/* Position */}
          <View style={styles.infoSection}>
            <View style={styles.positionBadge}>
              <Text style={styles.positionLabel}>Position in Queue</Text>
              <Text style={styles.positionValue}>#{position || '?'}</Text>
            </View>

            {/* Station details */}
            {station && (
              <View style={styles.stationBox}>
                <Text style={styles.stationBoxIcon}>⛽</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stationBoxName}>{station.name}</Text>
                  <Text style={styles.stationBoxLoc}>
                    {[station.location, station.city, station.region].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </View>
            )}

            {/* Details grid */}
            <View style={styles.detailsContainer}>
              {vehicle && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Plate</Text>
                    <Text style={styles.detailPlate}>{vehicle.registrationNumber || vehicle.licensePlate}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Vehicle</Text>
                    <Text style={styles.detailValue}>
                      {vehicle.type === 'Car' ? '🚗' : vehicle.type === 'Motorcycle' ? '🏍' : vehicle.type === 'Truck' ? '🚛' : '🚌'} {vehicle.type}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fuel</Text>
                    <Text style={styles.detailValue}>{vehicle.fuelType?.name || vehicle.fuelType || '—'}</Text>
                  </View>
                </>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Joined</Text>
                <Text style={styles.detailValue}>
                  {queue?.joinedAt ? new Date(queue.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Est. Wait</Text>
                <Text style={styles.detailValue}>~{(position || 0) * 2} min</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveQueue}>
            <Text style={styles.leaveBtnText}>Leave Queue</Text>
          </TouchableOpacity>
        </View>

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  h1: {
    ...commonStyles.h1,
  },
  h2: {
    ...commonStyles.h2,
  },
  body: {
    ...commonStyles.body,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  primaryBtn: {
    backgroundColor: newTheme.colors.amber,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: newTheme.borderRadius.lg,
  },
  primaryBtnText: {
    color: newTheme.colors.bg,
    fontSize: newTheme.fontSize.lg,
    fontWeight: newTheme.fontWeight.bold,
  },
  ticketCard: {
    backgroundColor: newTheme.colors.bg3,
    borderRadius: newTheme.borderRadius.xxl,
    padding: 24,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
    alignItems: 'center',
  },
  qrSection: {
    alignItems: 'center',
    width: '100%',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: newTheme.colors.white,
    borderRadius: newTheme.borderRadius.lg,
    marginBottom: 20,
  },
  verificationContainer: {
    alignItems: 'center',
    width: '100%',
  },
  verificationLabel: {
    color: newTheme.colors.text3,
    fontSize: newTheme.fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  verificationCodeBox: {
    backgroundColor: newTheme.colors.bg2,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: newTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: newTheme.colors.amberGlow,
  },
  verificationCode: {
    color: newTheme.colors.amber,
    fontSize: newTheme.fontSize.massive,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  verificationHint: {
    color: newTheme.colors.text3,
    fontSize: newTheme.fontSize.xs,
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: newTheme.colors.border,
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: newTheme.colors.border,
  },
  infoSection: {
    width: '100%',
    marginBottom: 24,
  },
  positionBadge: {
    backgroundColor: newTheme.colors.amberGlow,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: newTheme.borderRadius.xl,
    marginBottom: 16,
  },
  positionLabel: {
    color: newTheme.colors.amber,
    fontSize: newTheme.fontSize.lg,
    fontWeight: newTheme.fontWeight.semibold,
  },
  positionValue: {
    color: newTheme.colors.amber,
    fontSize: newTheme.fontSize.huge,
    fontWeight: newTheme.fontWeight.bold,
  },
  detailsContainer: {
    backgroundColor: newTheme.colors.bg2,
    borderRadius: newTheme.borderRadius.lg,
    padding: 16,
    gap: 12,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusServing: {
    backgroundColor: newTheme.colors.greenGlow,
  },
  statusWaiting: {
    backgroundColor: newTheme.colors.amberGlow,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: newTheme.colors.bg3,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: newTheme.colors.border,
  },
  stationBoxIcon: {
    fontSize: 28,
  },
  stationBoxName: {
    fontSize: 15,
    fontWeight: '700',
    color: newTheme.colors.text,
    marginBottom: 2,
  },
  stationBoxLoc: {
    fontSize: 12,
    color: newTheme.colors.text3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: newTheme.colors.text3,
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    color: newTheme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  detailPlate: {
    color: newTheme.colors.amber,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  leaveBtn: {
    width: '100%',
    backgroundColor: 'rgba(248,113,113,0.1)',
    paddingVertical: 16,
    borderRadius: newTheme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  leaveBtnText: {
    color: newTheme.colors.red,
    fontSize: newTheme.fontSize.lg,
    fontWeight: newTheme.fontWeight.semibold,
  },
});
