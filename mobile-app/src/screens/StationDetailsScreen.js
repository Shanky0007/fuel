import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { darkTheme } from '../theme/darkTheme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import axios from 'axios';


export default function StationDetailsScreen({ route, navigation }) {
    const { station } = route.params;
    const [loading, setLoading] = useState(false);

    const handleJoinQueue = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');

            // First check if user already has an active queue
            try {
                const existingQueueResponse = await axios.get(`${API_URL}/queue/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // User already has an active queue - navigate to ticket
                if (existingQueueResponse.data && existingQueueResponse.data.ticket) {
                    navigation.navigate('Ticket', {
                        ticket: existingQueueResponse.data.ticket,
                        queue: existingQueueResponse.data.queue,
                        position: existingQueueResponse.data.position,
                    });
                    setLoading(false);
                    return;
                }
            } catch (e) {
                // No active queue, continue to join
            }

            // Get user's first vehicle
            const vehiclesResponse = await axios.get(`${API_URL}/vehicles`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (vehiclesResponse.data.length === 0) {
                Alert.alert('No Vehicle', 'Please add a vehicle first in your profile.');
                setLoading(false);
                return;
            }

            const response = await axios.post(
                `${API_URL}/queue/join`,
                {
                    stationId: station.id,
                    vehicleId: vehiclesResponse.data[0].id,
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            navigation.navigate('Ticket', {
                ticket: response.data.ticket,
                queue: response.data.queue,
                position: response.data.position,
            });
        } catch (error) {
            console.error('Join queue error:', error);
            const errorData = error.response?.data;

            // Handle quota exceeded error with detailed message
            if (errorData?.code === 'QUOTA_EXCEEDED' && errorData?.details) {
                const details = errorData.details;
                const message = `⛽ Weekly Fuel Limit Reached\n\n` +
                    `Vehicle: ${details.vehicleType} (${details.registrationNumber})\n` +
                    `Weekly Limit: ${details.weeklyLimit}L\n` +
                    `Consumed: ${details.consumed}L\n` +
                    `Remaining: ${details.remaining}L\n\n` +
                    `Your vehicle has reached its weekly fuel quota. Please try again next Monday.`;

                if (typeof window !== 'undefined' && window.alert) {
                    window.alert(message);
                } else {
                    Alert.alert('Weekly Limit Exceeded', message);
                }
            } else {
                // Regular error handling
                const errorMessage = errorData?.error || 'Failed to join queue';
                if (typeof window !== 'undefined' && window.alert) {
                    window.alert(errorMessage);
                } else {
                    Alert.alert('Error', errorMessage);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Hero Section with Gradient */}
            <LinearGradient
                colors={darkTheme.colors.gradientPrimary}
                style={styles.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.heroContent}>
                    <Text style={styles.heroIcon}>⛽</Text>
                    <Text style={styles.heroTitle}>{station.name}</Text>
                    <Text style={styles.heroSubtitle}>{station.location}</Text>
                    {station.region && (
                        <Text style={styles.heroRegion}>📍 {station.region}, {station.country}</Text>
                    )}
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={darkTheme.colors.gradientPrimary}
                            style={styles.statGradient}
                        >
                            <Text style={styles.statIcon}>⏱️</Text>
                            <Text style={styles.statValue}>15 min</Text>
                            <Text style={styles.statLabel}>Wait Time</Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={darkTheme.colors.gradientAccent}
                            style={styles.statGradient}
                        >
                            <Text style={styles.statIcon}>🚗</Text>
                            <Text style={styles.statValue}>5</Text>
                            <Text style={styles.statLabel}>In Queue</Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={darkTheme.colors.gradientSuccess}
                            style={styles.statGradient}
                        >
                            <Text style={styles.statIcon}>⛽</Text>
                            <Text style={styles.statValue}>{station.totalPumps}</Text>
                            <Text style={styles.statLabel}>Pumps</Text>
                        </LinearGradient>
                    </View>
                </View>

                {/* Available Fuels Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Available Fuels 🔥</Text>
                    <View style={styles.fuelGrid}>
                        <View style={styles.fuelCard}>
                            <LinearGradient
                                colors={darkTheme.colors.gradientWarning}
                                style={styles.fuelGradient}
                            >
                                <Text style={styles.fuelIcon}>⛽</Text>
                                <Text style={styles.fuelName}>Petrol</Text>
                                <Text style={styles.fuelPrice}>₹101.5/L</Text>
                            </LinearGradient>
                        </View>

                        <View style={styles.fuelCard}>
                            <LinearGradient
                                colors={darkTheme.colors.gradientSuccess}
                                style={styles.fuelGradient}
                            >
                                <Text style={styles.fuelIcon}>🛢️</Text>
                                <Text style={styles.fuelName}>Diesel</Text>
                                <Text style={styles.fuelPrice}>₹87.5/L</Text>
                            </LinearGradient>
                        </View>

                        <View style={styles.fuelCard}>
                            <LinearGradient
                                colors={darkTheme.colors.gradientPrimary}
                                style={styles.fuelGradient}
                            >
                                <Text style={styles.fuelIcon}>⚡</Text>
                                <Text style={styles.fuelName}>EV</Text>
                                <Text style={styles.fuelPrice}>₹15/kWh</Text>
                            </LinearGradient>
                        </View>
                    </View>
                </View>

                {/* Station Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Station Info 📋</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status</Text>
                            <View style={[styles.statusBadge,
                            station.status === 'OPEN' ? styles.statusOpen :
                                station.status === 'CLOSED' ? styles.statusClosed : styles.statusMaintenance
                            ]}>
                                <Text style={styles.statusText}>{station.status}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Operating Hours</Text>
                            <Text style={styles.infoValue}>6:00 AM - 10:00 PM</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Payment Methods</Text>
                            <Text style={styles.infoValue}>Cash, Card, UPI</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Join Queue Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.joinButton}
                    onPress={handleJoinQueue}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={darkTheme.colors.gradientAccent}
                        style={styles.joinGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {loading ? (
                            <ActivityIndicator color={darkTheme.colors.white} />
                        ) : (
                            <Text style={styles.joinButtonText}>Join Queue</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkTheme.colors.background,
    },
    hero: {
        height: 280,
        paddingTop: 50,
        paddingHorizontal: darkTheme.spacing.lg,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
    },
    backIcon: {
        fontSize: 24,
        color: darkTheme.colors.white,
    },
    heroContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroIcon: {
        fontSize: 64,
        marginBottom: darkTheme.spacing.md,
    },
    heroTitle: {
        fontSize: darkTheme.fontSize.xxl,
        fontWeight: darkTheme.fontWeight.extrabold,
        color: darkTheme.colors.white,
        marginBottom: darkTheme.spacing.xs,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: darkTheme.fontSize.md,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    heroRegion: {
        fontSize: darkTheme.fontSize.sm,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: darkTheme.spacing.xs,
    },
    content: {
        flex: 1,
        marginTop: -30,
        borderTopLeftRadius: darkTheme.borderRadius.xxl,
        borderTopRightRadius: darkTheme.borderRadius.xxl,
        backgroundColor: darkTheme.colors.background,
        paddingTop: darkTheme.spacing.lg,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: darkTheme.spacing.lg,
        gap: darkTheme.spacing.md,
        marginBottom: darkTheme.spacing.xl,
    },
    statCard: {
        flex: 1,
        borderRadius: darkTheme.borderRadius.lg,
        overflow: 'hidden',
        ...darkTheme.shadows.medium,
    },
    statGradient: {
        padding: darkTheme.spacing.md,
        alignItems: 'center',
        gap: darkTheme.spacing.xs,
    },
    statIcon: {
        fontSize: 24,
    },
    statValue: {
        fontSize: darkTheme.fontSize.xl,
        fontWeight: darkTheme.fontWeight.extrabold,
        color: darkTheme.colors.white,
    },
    statLabel: {
        fontSize: darkTheme.fontSize.xs,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: darkTheme.fontWeight.medium,
    },
    section: {
        paddingHorizontal: darkTheme.spacing.lg,
        marginBottom: darkTheme.spacing.xl,
    },
    sectionTitle: {
        fontSize: darkTheme.fontSize.lg,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.text,
        marginBottom: darkTheme.spacing.md,
    },
    fuelGrid: {
        flexDirection: 'row',
        gap: darkTheme.spacing.md,
    },
    fuelCard: {
        flex: 1,
        borderRadius: darkTheme.borderRadius.lg,
        overflow: 'hidden',
        ...darkTheme.shadows.small,
    },
    fuelGradient: {
        padding: darkTheme.spacing.md,
        alignItems: 'center',
        gap: darkTheme.spacing.xs,
    },
    fuelIcon: {
        fontSize: 28,
    },
    fuelName: {
        fontSize: darkTheme.fontSize.sm,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.white,
    },
    fuelPrice: {
        fontSize: darkTheme.fontSize.xs,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    infoCard: {
        backgroundColor: darkTheme.colors.card,
        borderRadius: darkTheme.borderRadius.lg,
        padding: darkTheme.spacing.md,
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: darkTheme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: darkTheme.colors.divider,
    },
    infoLabel: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.textSecondary,
    },
    infoValue: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.text,
        fontWeight: darkTheme.fontWeight.medium,
    },
    statusBadge: {
        paddingHorizontal: darkTheme.spacing.md,
        paddingVertical: darkTheme.spacing.xs,
        borderRadius: darkTheme.borderRadius.round,
    },
    statusOpen: {
        backgroundColor: darkTheme.colors.successGlow,
    },
    statusClosed: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    statusMaintenance: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
    },
    statusText: {
        fontSize: darkTheme.fontSize.xs,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.text,
        textTransform: 'uppercase',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: darkTheme.spacing.lg,
        backgroundColor: darkTheme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: darkTheme.colors.border,
    },
    joinButton: {
        borderRadius: darkTheme.borderRadius.lg,
        overflow: 'hidden',
        ...darkTheme.shadows.glow,
    },
    joinGradient: {
        padding: darkTheme.spacing.md + 4,
        alignItems: 'center',
    },
    joinButtonText: {
        color: darkTheme.colors.white,
        fontSize: darkTheme.fontSize.lg,
        fontWeight: darkTheme.fontWeight.extrabold,
        letterSpacing: 0.5,
    },
});
