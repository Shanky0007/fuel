import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { darkTheme } from '../theme/darkTheme';
import { API_URL } from '../config';


export default function StationListScreen({ navigation }) {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        getUserId();
    }, []);

    useEffect(() => {
        if (userId) {
            loadStations();
        }
    }, [userId]);

    const getUserId = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                // Decode token to get userId (simplified - in production use proper JWT decode)
                const response = await axios.get(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserId(response.data.id);
            }
        } catch (error) {
            console.error('Error getting user ID:', error);
        }
    };

    const loadStations = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/stations?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStations(response.data);
        } catch (error) {
            console.error('Error loading stations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadStations();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'OPEN':
                return darkTheme.colors.stationOpen;
            case 'CLOSED':
                return darkTheme.colors.stationClosed;
            case 'MAINTENANCE':
                return darkTheme.colors.stationMaintenance;
            default:
                return darkTheme.colors.textSecondary;
        }
    };

    const formatDistance = (distance) => {
        if (distance === null || distance === undefined) {
            return 'Distance unavailable';
        }
        return `${distance.toFixed(1)} km`;
    };

    const renderStation = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('StationDetails', { station: item })}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>⛽</Text>
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.stationName}>{item.name}</Text>
                    <Text style={styles.address}>{item.location}</Text>
                    {item.region && (
                        <Text style={styles.region}>📍 {item.region}, {item.country}</Text>
                    )}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>🚗</Text>
                            <Text style={styles.metaText}>{item.totalPumps} Pumps</Text>
                        </View>
                        {item.distance !== null && item.distance !== undefined && (
                            <View style={styles.metaItem}>
                                <Text style={styles.metaIcon}>📏</Text>
                                <Text style={styles.metaText}>{formatDistance(item.distance)}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Nearby Stations</Text>
                <Text style={styles.subtitle}>Find your perfect fuel stop</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={darkTheme.colors.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={stations}
                    renderItem={renderStation}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={darkTheme.colors.primary}
                            colors={[darkTheme.colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🔍</Text>
                            <Text style={styles.emptyText}>No stations found in your region</Text>
                            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkTheme.colors.background,
    },
    header: {
        paddingTop: darkTheme.spacing.xxl,
        paddingBottom: darkTheme.spacing.lg,
        paddingHorizontal: darkTheme.spacing.lg,
        backgroundColor: darkTheme.colors.surface,
    },
    title: {
        fontSize: darkTheme.fontSize.xxxl,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.text,
        marginBottom: darkTheme.spacing.xs,
    },
    subtitle: {
        fontSize: darkTheme.fontSize.md,
        color: darkTheme.colors.textSecondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: darkTheme.spacing.lg,
        paddingBottom: darkTheme.spacing.xxl,
    },
    card: {
        backgroundColor: darkTheme.colors.card,
        borderRadius: darkTheme.borderRadius.lg,
        padding: darkTheme.spacing.md,
        marginBottom: darkTheme.spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...darkTheme.shadows.medium,
    },
    cardHeader: {
        flexDirection: 'row',
        flex: 1,
        gap: darkTheme.spacing.md,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: darkTheme.borderRadius.md,
        backgroundColor: darkTheme.colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 28,
    },
    cardContent: {
        flex: 1,
        gap: darkTheme.spacing.xs,
    },
    stationName: {
        fontSize: darkTheme.fontSize.lg,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.text,
    },
    address: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.textSecondary,
    },
    region: {
        fontSize: darkTheme.fontSize.xs,
        color: darkTheme.colors.textSecondary,
        marginTop: darkTheme.spacing.xs,
    },
    metaRow: {
        flexDirection: 'row',
        gap: darkTheme.spacing.md,
        marginTop: darkTheme.spacing.sm,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: darkTheme.spacing.xs,
    },
    metaIcon: {
        fontSize: 14,
    },
    metaText: {
        fontSize: darkTheme.fontSize.xs,
        color: darkTheme.colors.textSecondary,
        fontWeight: darkTheme.fontWeight.medium,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: darkTheme.spacing.md,
        paddingVertical: darkTheme.spacing.sm,
        borderRadius: darkTheme.borderRadius.round,
        gap: darkTheme.spacing.xs,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontWeight: darkTheme.fontWeight.bold,
        fontSize: darkTheme.fontSize.xs,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: darkTheme.spacing.xxl,
        paddingHorizontal: darkTheme.spacing.lg,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: darkTheme.spacing.md,
    },
    emptyText: {
        fontSize: darkTheme.fontSize.lg,
        color: darkTheme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: darkTheme.spacing.sm,
    },
    emptySubtext: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.textDisabled,
        textAlign: 'center',
    },
});
