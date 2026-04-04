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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={newTheme.colors.amber} />
      </View>
    );
  }

  if (!queueData || !queueData.ticket) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
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
      </View>
    );
  }

  const { ticket, position } = queueData;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.h1}>My Ticket</Text>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={styles.ticketCard}>
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <QRCode
                value={ticket?.qrCodeData || 'No data'}
                size={220}
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
                Show this code if QR scanning doesn't work
              </Text>
            </View>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
          </View>

          <View style={styles.infoSection}>
            <View style={styles.positionBadge}>
              <Text style={styles.positionLabel}>Position in Queue</Text>
              <Text style={styles.positionValue}>#{position || '?'}</Text>
            </View>

            {ticketInfo && (
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Station:</Text>
                  <Text style={styles.detailValue}>{ticketInfo.stationName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vehicle:</Text>
                  <Text style={styles.detailValue}>{ticketInfo.vehicleType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fuel Type:</Text>
                  <Text style={styles.detailValue}>{ticketInfo.fuelType}</Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveQueue}>
            <Text style={styles.leaveBtnText}>Leave Queue</Text>
          </TouchableOpacity>
        </View>

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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: newTheme.colors.text2,
    fontSize: newTheme.fontSize.base,
  },
  detailValue: {
    color: newTheme.colors.text,
    fontSize: newTheme.fontSize.lg,
    fontWeight: newTheme.fontWeight.medium,
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
