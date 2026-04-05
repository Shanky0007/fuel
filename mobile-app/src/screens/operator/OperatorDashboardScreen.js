import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Alert,
    Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { OperatorAuthContext } from '../../context/OperatorAuthContext';
import { ticketService, operatorQueueService } from '../../services/operatorApi';
import { newTheme } from '../../theme/newTheme';


export default function OperatorDashboardScreen() {
    const { operator, logout, isLoading: authLoading } = useContext(OperatorAuthContext);
    const [activeTab, setActiveTab] = useState('scan');
    const [queue, setQueue] = useState([]);
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [fuelAmounts, setFuelAmounts] = useState({});
    const [permission, requestPermission] = useCameraPermissions();
    const hasScannedRef = useRef(false);

    useEffect(() => {
        if (operator && operator.id) {
            loadQueue();
        }
    }, [activeTab, operator]);

    // Show loading while auth is initializing
    if (authLoading || !operator || !operator.id) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={newTheme.colors.amber} />
                <Text style={{ color: newTheme.colors.text2, marginTop: 16 }}>Loading...</Text>
            </View>
        );
    }

    const loadQueue = async () => {
        try {
            const data = await operatorQueueService.getRegionalQueues();
            const activeQueues = (data || []).filter(q =>
                q.status === 'WAITING' || q.status === 'SERVING'
            );
            setQueue(activeQueues);
        } catch (error) {
            console.error('Failed to load queue:', error);
            // If error, set empty queue to show empty state
            setQueue([]);
        } finally {
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadQueue();
    };

    const handleScan = async (qrData) => {
        if (hasScannedRef.current) return;
        hasScannedRef.current = true;

        setLoading(true);
        setScanning(false);
        try {
            const result = await ticketService.verify(qrData);
            setScanResult({ success: true, data: result });
            setTimeout(() => {
                setScanResult(null);
                hasScannedRef.current = false;
            }, 8000);
            loadQueue();
        } catch (error) {
            const errData = error.response?.data || {};
            setScanResult({
                success: false,
                message: errData.error || 'Verification failed',
                code: errData.code,
                ticketStation: errData.ticketStation,
                ticketCity: errData.ticketCity,
            });
            setTimeout(() => {
                setScanResult(null);
                hasScannedRef.current = false;
            }, 8000);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
            Alert.alert('Invalid Code', 'Please enter a valid 6-character verification code');
            return;
        }

        setLoading(true);
        try {
            const result = await ticketService.verifyByCode(verificationCode.trim().toUpperCase());
            setScanResult({ success: true, data: result });
            setVerificationCode('');
            setTimeout(() => setScanResult(null), 8000);
            loadQueue();
        } catch (error) {
            const errData = error.response?.data || {};
            setScanResult({
                success: false,
                message: errData.error || 'Invalid verification code',
                code: errData.code,
                ticketStation: errData.ticketStation,
                ticketCity: errData.ticketCity,
            });
            setTimeout(() => setScanResult(null), 8000);
        } finally {
            setLoading(false);
        }
    };

    const handleFuelAmountChange = (queueId, value) => {
        // Only allow numeric input (with optional decimal)
        const cleaned = value.replace(/[^0-9.]/g, '');
        setFuelAmounts(prev => ({
            ...prev,
            [queueId]: cleaned
        }));
    };

    const getFuelAmountForItem = (item) => {
        const inputValue = fuelAmounts[item.id];
        if (inputValue !== undefined && inputValue !== '') {
            return parseFloat(inputValue) || 0;
        }
        // Use remaining quota as default (auto-capped by backend data)
        const remaining = item.fuelQuotaInfo?.remaining;
        if (remaining !== null && remaining !== undefined) {
            return Math.min(remaining, remaining); // remaining is already the max
        }
        return 0;
    };

    const handleComplete = async (queueId, item) => {
        const fuelAmount = getFuelAmountForItem(item);
        const quotaInfo = item.fuelQuotaInfo;

        if (fuelAmount <= 0) {
            if (Platform.OS === 'web') {
                window.alert('Please enter a valid fuel amount greater than 0.');
            } else {
                Alert.alert('Invalid Amount', 'Please enter a valid fuel amount greater than 0.');
            }
            return;
        }

        // Check against remaining quota on client side too
        if (quotaInfo && quotaInfo.remaining !== null && fuelAmount > quotaInfo.remaining) {
            const msg = `Cannot dispense ${fuelAmount}L. This vehicle only has ${quotaInfo.remaining}L remaining this week.\n\nWeekly Limit: ${quotaInfo.weeklyLimit}L\nUsed: ${quotaInfo.consumedThisWeek}L`;
            if (Platform.OS === 'web') {
                window.alert(msg);
            } else {
                Alert.alert('⚠️ Quota Exceeded', msg);
            }
            return;
        }

        const quotaMessage = quotaInfo
            ? `\n\nWeekly Quota: ${quotaInfo.consumedThisWeek}L / ${quotaInfo.weeklyLimit}L used\nRemaining after: ${Math.round((quotaInfo.remaining - fuelAmount) * 100) / 100}L`
            : '';

        const confirmMessage = `Dispense ${fuelAmount}L of fuel?${quotaMessage}`;

        const doComplete = async () => {
            try {
                const result = await ticketService.complete(queueId, fuelAmount);
                const afterQuota = result.fuelQuotaInfo;
                const afterMsg = afterQuota
                    ? `\n\nRemaining weekly quota: ${afterQuota.remaining}L`
                    : '';
                const successMsg = `${fuelAmount}L fuel dispensed successfully.${afterMsg}`;
                if (Platform.OS === 'web') {
                    window.alert(successMsg);
                } else {
                    Alert.alert('✅ Service Completed', successMsg);
                }
                // Clear the fuel amount input
                setFuelAmounts(prev => {
                    const newAmounts = { ...prev };
                    delete newAmounts[queueId];
                    return newAmounts;
                });
                loadQueue();
            } catch (error) {
                const errMsg = error.response?.data?.error || 'Failed to complete service';
                if (Platform.OS === 'web') {
                    window.alert(errMsg);
                } else {
                    Alert.alert('Error', errMsg);
                }
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(confirmMessage)) {
                await doComplete();
            }
        } else {
            Alert.alert(
                'Confirm Fuel Dispensing',
                confirmMessage,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: `Dispense ${fuelAmount}L`,
                        onPress: doComplete,
                    },
                ]
            );
        }
    };

    const startScanning = async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert('Camera Permission', 'Camera access is required to scan QR codes');
                return;
            }
        }
        hasScannedRef.current = false;
        setScanning(true);
    };

    const handleBarCodeScanned = ({ data }) => {
        if (data && !hasScannedRef.current) {
            handleScan(data);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={newTheme.colors.bg} />

            {/* Header */}
            <SafeAreaView>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerAvatar}>
                            <Text style={styles.headerAvatarText}>
                                {operator?.name?.charAt(0)?.toUpperCase() || 'O'}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>{operator?.name}</Text>
                            <Text style={styles.headerSubtitle}>
                                {operator?.assignedStation
                                    ? `⛽ ${operator.assignedStation.name}`
                                    : 'Operator'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <Text style={styles.logoutText}>Exit</Text>
                    </TouchableOpacity>
                </View>
                {operator?.assignedStation && (
                    <View style={styles.stationBar}>
                        <View style={styles.stationBarDot} />
                        <Text style={styles.stationBarText}>
                            {operator.assignedStation.city || operator.assignedStation.region || 'On Duty'}
                        </Text>
                    </View>
                )}
            </SafeAreaView>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'scan' && styles.tabActive]}
                    onPress={() => setActiveTab('scan')}
                >
                    <Text style={[styles.tabText, activeTab === 'scan' && styles.tabTextActive]}>
                        📷 Scan QR
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'queue' && styles.tabActive]}
                    onPress={() => setActiveTab('queue')}
                >
                    <Text style={[styles.tabText, activeTab === 'queue' && styles.tabTextActive]}>
                        📋 Queue ({queue.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'scan' ? (
                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                    {/* QR Scanner */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>📷 Scan Customer QR Code</Text>

                        {scanning ? (
                            <View style={styles.cameraContainer}>
                                <CameraView
                                    style={styles.camera}
                                    facing="back"
                                    barcodeScannerSettings={{
                                        barcodeTypes: ['qr'],
                                    }}
                                    onBarcodeScanned={handleBarCodeScanned}
                                />
                                <TouchableOpacity
                                    style={styles.stopButton}
                                    onPress={() => setScanning(false)}
                                >
                                    <Text style={styles.stopButtonText}>Stop Camera</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.scannerPlaceholder}>
                                <Text style={styles.scannerIcon}>📱</Text>
                                <Text style={styles.scannerText}>Click below to start camera</Text>
                                <TouchableOpacity
                                    style={styles.scanButton}
                                    onPress={startScanning}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.scanButtonText}>Start Camera</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Manual Input */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>🔢 Enter Verification Code</Text>
                        <Text style={styles.codeHint}>
                            If QR scanning doesn't work, ask the customer for their 6-digit code
                        </Text>
                        <TextInput
                            style={styles.codeInput}
                            value={verificationCode}
                            onChangeText={(text) => setVerificationCode(text.toUpperCase().slice(0, 6))}
                            placeholder="ABC123"
                            placeholderTextColor={newTheme.colors.text3}
                            maxLength={6}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={[
                                styles.verifyButton,
                                (loading || verificationCode.length !== 6) && styles.verifyButtonDisabled
                            ]}
                            onPress={handleVerifyCode}
                            disabled={loading || verificationCode.length !== 6}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.verifyButtonText}>
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Scan Result */}
                    {scanResult && (
                        <View style={[
                            styles.resultCard,
                            scanResult.success ? styles.resultSuccess : styles.resultError
                        ]}>
                            {scanResult.success ? (
                                <>
                                    <Text style={styles.resultTitleSuccess}>✅ Ticket Verified!</Text>
                                    <Text style={styles.resultText}>
                                        Customer: {scanResult.data.queue?.user?.name}
                                    </Text>
                                    <Text style={styles.resultText}>
                                        Vehicle: {scanResult.data.queue?.vehicle?.type} ({scanResult.data.queue?.vehicle?.registrationNumber})
                                    </Text>
                                    {scanResult.data.fuelQuotaInfo && (
                                        <View style={styles.quotaResultBox}>
                                            <Text style={styles.quotaResultTitle}>📊 Weekly Fuel Quota</Text>
                                            <Text style={styles.quotaResultText}>
                                                Remaining: {scanResult.data.fuelQuotaInfo.remaining}L / {scanResult.data.fuelQuotaInfo.weeklyLimit}L
                                            </Text>
                                            <Text style={styles.quotaResultText}>
                                                Used this week: {scanResult.data.fuelQuotaInfo.consumedThisWeek}L
                                            </Text>
                                            <View style={styles.quotaProgressBarBg}>
                                                <View style={[
                                                    styles.quotaProgressBarFill,
                                                    {
                                                        width: `${Math.min(100, (scanResult.data.fuelQuotaInfo.consumedThisWeek / scanResult.data.fuelQuotaInfo.weeklyLimit) * 100)}%`,
                                                        backgroundColor: scanResult.data.fuelQuotaInfo.remaining <= 0
                                                            ? newTheme.colors.red
                                                            : scanResult.data.fuelQuotaInfo.remaining < scanResult.data.fuelQuotaInfo.weeklyLimit * 0.2
                                                                ? newTheme.colors.amber
                                                                : newTheme.colors.green,
                                                    },
                                                ]} />
                                            </View>
                                        </View>
                                    )}
                                </>
                            ) : scanResult.code === 'WRONG_STATION' ? (
                                <>
                                    <Text style={styles.resultTitleError}>🚫 Wrong Station</Text>
                                    <View style={styles.wrongStationBox}>
                                        <Text style={styles.wrongStationLabel}>This ticket belongs to</Text>
                                        <Text style={styles.wrongStationName}>⛽ {scanResult.ticketStation}</Text>
                                        {scanResult.ticketCity && (
                                            <Text style={styles.wrongStationCity}>{scanResult.ticketCity}</Text>
                                        )}
                                    </View>
                                    <Text style={styles.resultTextError}>
                                        You can only verify tickets for your assigned station.
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.resultTitleError}>❌ Verification Failed</Text>
                                    <Text style={styles.resultTextError}>{scanResult.message}</Text>
                                </>
                            )}
                        </View>
                    )}
                </ScrollView>
            ) : (
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[newTheme.colors.amber]}
                            tintColor={newTheme.colors.amber}
                        />
                    }
                >
                    <View style={styles.queueHeader}>
                        <Text style={styles.cardTitle}>📋 Current Queue</Text>
                        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                            <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
                        </TouchableOpacity>
                    </View>

                    {queue.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🎉</Text>
                            <Text style={styles.emptyTitle}>No vehicles in queue</Text>
                            <Text style={styles.emptyText}>All clear! Waiting for customers...</Text>
                        </View>
                    ) : (
                        queue.map((item, index) => (
                            <View key={item.id} style={styles.queueCard}>
                                <View style={styles.queueCardHeader}>
                                    <View style={styles.positionBadge}>
                                        <Text style={styles.positionText}>#{index + 1}</Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        item.status === 'SERVING' ? styles.statusServing : styles.statusWaiting
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            item.status === 'SERVING' ? styles.statusTextServing : styles.statusTextWaiting
                                        ]}>
                                            {item.status}
                                        </Text>
                                    </View>
                                </View>

                                {/* License Plate */}
                                <View style={styles.plateRow}>
                                    <Text style={styles.plateText}>
                                        {item.vehicle?.registrationNumber || item.vehicle?.licensePlate || '—'}
                                    </Text>
                                    <Text style={styles.plateVehicleType}>
                                        {item.vehicle?.type === 'Car' ? '🚗' : item.vehicle?.type === 'Motorcycle' ? '🏍' : item.vehicle?.type === 'Truck' ? '🚛' : '🚌'} {item.vehicle?.type}
                                    </Text>
                                </View>

                                <View style={styles.queueDetails}>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Customer:</Text>
                                        <Text style={styles.infoValue}>{item.user?.name || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Fuel:</Text>
                                        <Text style={styles.infoValue}>{item.vehicle?.fuelType?.name || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Joined:</Text>
                                        <Text style={styles.infoValue}>
                                            {new Date(item.joinedAt).toLocaleTimeString()}
                                        </Text>
                                    </View>
                                </View>

                                {/* Fuel Quota Info — shown automatically from backend */}
                                {item.fuelQuotaInfo && (
                                    <View style={styles.quotaSection}>
                                        <View style={styles.quotaHeader}>
                                            <Text style={styles.quotaSectionTitle}>⛽ Weekly Fuel Quota</Text>
                                            <Text style={[
                                                styles.quotaRemainingBadge,
                                                item.fuelQuotaInfo.remaining <= 0
                                                    ? styles.quotaBadgeDanger
                                                    : item.fuelQuotaInfo.remaining < item.fuelQuotaInfo.weeklyLimit * 0.2
                                                        ? styles.quotaBadgeWarning
                                                        : styles.quotaBadgeOk
                                            ]}>
                                                <Text style={styles.quotaBadgeText}>
                                                    {item.fuelQuotaInfo.remaining}L left
                                                </Text>
                                            </Text>
                                        </View>
                                        <View style={styles.quotaProgressBarBg}>
                                            <View style={[
                                                styles.quotaProgressBarFill,
                                                {
                                                    width: `${Math.min(100, (item.fuelQuotaInfo.consumedThisWeek / item.fuelQuotaInfo.weeklyLimit) * 100)}%`,
                                                    backgroundColor: item.fuelQuotaInfo.remaining <= 0
                                                        ? newTheme.colors.red
                                                        : item.fuelQuotaInfo.remaining < item.fuelQuotaInfo.weeklyLimit * 0.2
                                                            ? newTheme.colors.amber
                                                            : newTheme.colors.green,
                                                },
                                            ]} />
                                        </View>
                                        <Text style={styles.quotaDetailText}>
                                            {item.fuelQuotaInfo.consumedThisWeek}L used / {item.fuelQuotaInfo.weeklyLimit}L weekly limit
                                        </Text>
                                    </View>
                                )}

                                {item.status === 'SERVING' && (
                                    <View style={styles.completionSection}>
                                        {item.fuelQuotaInfo?.remaining <= 0 ? (
                                            <View style={styles.quotaExhaustedBox}>
                                                <Text style={styles.quotaExhaustedIcon}>🚫</Text>
                                                <Text style={styles.quotaExhaustedTitle}>Weekly Quota Exhausted</Text>
                                                <Text style={styles.quotaExhaustedText}>
                                                    This vehicle has used all {item.fuelQuotaInfo.weeklyLimit}L of its weekly fuel limit. Cannot dispense more fuel.
                                                </Text>
                                            </View>
                                        ) : (
                                            <>
                                                {/* Fuel Amount Input */}
                                                <View style={styles.fuelInputGroup}>
                                                    <View style={styles.fuelInputHeader}>
                                                        <Text style={styles.fuelInputLabel}>Fuel to Dispense</Text>
                                                        <Text style={styles.fuelInputMax}>
                                                            Max: {item.fuelQuotaInfo?.remaining ?? '∞'}L
                                                        </Text>
                                                    </View>
                                                    <View style={styles.fuelInputRow}>
                                                        <TextInput
                                                            style={styles.fuelInput}
                                                            value={String(fuelAmounts[item.id] ?? (item.fuelQuotaInfo?.remaining ?? ''))}
                                                            onChangeText={(text) => handleFuelAmountChange(item.id, text)}
                                                            placeholder="Enter liters"
                                                            placeholderTextColor={newTheme.colors.text3}
                                                            keyboardType="numeric"
                                                            selectTextOnFocus
                                                        />
                                                        <Text style={styles.fuelUnit}>L</Text>
                                                    </View>
                                                    {fuelAmounts[item.id] && parseFloat(fuelAmounts[item.id]) > (item.fuelQuotaInfo?.remaining ?? Infinity) && (
                                                        <Text style={styles.fuelOverLimitWarning}>
                                                            ⚠️ Exceeds remaining quota of {item.fuelQuotaInfo?.remaining}L
                                                        </Text>
                                                    )}
                                                </View>

                                                {/* Complete Button */}
                                                <TouchableOpacity
                                                    style={styles.completeButton}
                                                    onPress={() => handleComplete(item.id, item)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={styles.completeButtonText}>
                                                        ✅ Dispense {getFuelAmountForItem(item)}L & Complete
                                                    </Text>
                                                </TouchableOpacity>
                                            </>
                                        )}
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    headerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: newTheme.colors.amber,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerAvatarText: {
        fontSize: 18,
        fontWeight: '800',
        color: newTheme.colors.bg,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: newTheme.colors.text,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 12,
        color: newTheme.colors.text2,
        marginTop: 1,
    },
    logoutButton: {
        backgroundColor: newTheme.colors.bg3,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: newTheme.colors.border,
    },
    logoutText: {
        color: newTheme.colors.red,
        fontWeight: '600',
        fontSize: 12,
    },
    stationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 4,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(52,211,153,0.06)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(52,211,153,0.1)',
        gap: 8,
    },
    stationBarDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: newTheme.colors.green,
    },
    stationBarText: {
        fontSize: 12,
        fontWeight: '600',
        color: newTheme.colors.green,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: newTheme.colors.bg2,
        marginHorizontal: 20,
        marginVertical: 16,
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: newTheme.colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: newTheme.colors.bg3,
    },
    tabText: {
        color: newTheme.colors.text2,
        fontWeight: '600',
        fontSize: 13,
    },
    tabTextActive: {
        color: newTheme.colors.amber,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        gap: 20,
    },
    card: {
        backgroundColor: newTheme.colors.bg2,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: newTheme.colors.border,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: newTheme.colors.text,
        marginBottom: 16,
    },
    cameraContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    camera: {
        height: 300,
        borderRadius: 12,
    },
    stopButton: {
        backgroundColor: newTheme.colors.red,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
        borderRadius: 12,
    },
    stopButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    scannerPlaceholder: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    scannerIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    scannerText: {
        color: newTheme.colors.text2,
        marginBottom: 20,
    },
    scanButton: {
        height: 54,
        backgroundColor: newTheme.colors.green,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    scanButtonText: {
        color: newTheme.colors.bg,
        fontWeight: '700',
        fontSize: 16,
    },
    codeHint: {
        color: newTheme.colors.text2,
        fontSize: 13,
        marginBottom: 16,
    },
    codeInput: {
        backgroundColor: newTheme.colors.bg3,
        borderWidth: 1,
        borderColor: newTheme.colors.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 20,
        textAlign: 'center',
        letterSpacing: 8,
        fontWeight: '700',
        color: newTheme.colors.text,
        marginBottom: 16,
    },
    verifyButton: {
        height: 54,
        backgroundColor: newTheme.colors.amber,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyButtonDisabled: {
        opacity: 0.5,
    },
    verifyButtonText: {
        color: newTheme.colors.bg,
        fontWeight: '700',
        fontSize: 16,
    },
    resultCard: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
    },
    resultSuccess: {
        backgroundColor: newTheme.colors.greenGlow,
        borderColor: newTheme.colors.green,
    },
    resultError: {
        backgroundColor: 'rgba(248,113,113,0.15)',
        borderColor: newTheme.colors.red,
    },
    resultTitleSuccess: {
        fontSize: 16,
        fontWeight: '700',
        color: newTheme.colors.green,
        marginBottom: 8,
    },
    resultTitleError: {
        fontSize: 16,
        fontWeight: '700',
        color: newTheme.colors.red,
        marginBottom: 8,
    },
    resultText: {
        fontSize: 13,
        color: newTheme.colors.text2,
    },
    resultTextError: {
        fontSize: 13,
        color: newTheme.colors.red,
    },
    queueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    refreshButton: {
        backgroundColor: newTheme.colors.bg3,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: newTheme.colors.border,
    },
    refreshButtonText: {
        color: newTheme.colors.text2,
        fontWeight: '600',
        fontSize: 13,
    },
    emptyState: {
        backgroundColor: newTheme.colors.bg2,
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: newTheme.colors.border,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: newTheme.colors.text,
        marginBottom: 4,
    },
    emptyText: {
        color: newTheme.colors.text2,
    },
    queueCard: {
        backgroundColor: newTheme.colors.bg2,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: newTheme.colors.border,
    },
    queueCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    positionBadge: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: newTheme.colors.amber,
    },
    positionText: {
        color: newTheme.colors.bg,
        fontWeight: '700',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusServing: {
        backgroundColor: newTheme.colors.greenGlow,
    },
    statusWaiting: {
        backgroundColor: newTheme.colors.amberGlow,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    statusTextServing: {
        color: newTheme.colors.green,
    },
    statusTextWaiting: {
        color: newTheme.colors.amber,
    },
    queueDetails: {
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
    },
    infoLabel: {
        color: newTheme.colors.text2,
        fontWeight: '500',
        fontSize: 13,
    },
    infoValue: {
        color: newTheme.colors.text,
        fontWeight: '600',
        fontSize: 13,
    },
    quotaResultBox: {
        marginTop: 16,
        backgroundColor: newTheme.colors.blueGlow,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: newTheme.colors.blue,
    },
    quotaResultTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: newTheme.colors.blue,
        marginBottom: 4,
    },
    quotaResultText: {
        fontSize: 13,
        color: newTheme.colors.text2,
        marginBottom: 2,
    },
    quotaProgressBarBg: {
        height: 8,
        backgroundColor: newTheme.colors.bg3,
        borderRadius: 4,
        marginTop: 8,
        overflow: 'hidden',
    },
    quotaProgressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    quotaSection: {
        marginTop: 16,
        backgroundColor: newTheme.colors.blueGlow,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: newTheme.colors.blue,
    },
    quotaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    quotaSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: newTheme.colors.blue,
    },
    quotaRemainingBadge: {
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 20,
    },
    quotaBadgeOk: {
        backgroundColor: newTheme.colors.greenGlow,
    },
    quotaBadgeWarning: {
        backgroundColor: newTheme.colors.amberGlow,
    },
    quotaBadgeDanger: {
        backgroundColor: 'rgba(248,113,113,0.2)',
    },
    quotaBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: newTheme.colors.text,
    },
    quotaDetailText: {
        fontSize: 11,
        color: newTheme.colors.text3,
        marginTop: 4,
    },
    quotaExhaustedBox: {
        backgroundColor: 'rgba(248,113,113,0.1)',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(248,113,113,0.3)',
    },
    quotaExhaustedIcon: {
        fontSize: 36,
        marginBottom: 8,
    },
    quotaExhaustedTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: newTheme.colors.red,
        marginBottom: 4,
    },
    quotaExhaustedText: {
        fontSize: 13,
        color: newTheme.colors.text2,
        textAlign: 'center',
    },
    completionSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: newTheme.colors.border,
        gap: 16,
    },
    fuelInputGroup: {
        gap: 4,
    },
    fuelInputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fuelInputLabel: {
        color: newTheme.colors.text2,
        fontWeight: '600',
        fontSize: 13,
    },
    fuelInputMax: {
        color: newTheme.colors.amber,
        fontWeight: '700',
        fontSize: 11,
    },
    fuelInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fuelInput: {
        flex: 1,
        backgroundColor: newTheme.colors.bg3,
        borderWidth: 2,
        borderColor: newTheme.colors.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        fontWeight: '700',
        color: newTheme.colors.text,
        textAlign: 'center',
    },
    fuelUnit: {
        fontSize: 16,
        fontWeight: '700',
        color: newTheme.colors.text2,
    },
    fuelOverLimitWarning: {
        color: newTheme.colors.red,
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    completeButton: {
        height: 54,
        backgroundColor: newTheme.colors.green,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completeButtonText: {
        color: newTheme.colors.bg,
        fontWeight: '700',
        fontSize: 16,
    },
    // License plate in queue card
    plateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: newTheme.colors.bg3,
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    plateText: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 2,
        color: newTheme.colors.amber,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    plateVehicleType: {
        fontSize: 12,
        color: newTheme.colors.text2,
    },
    // Wrong station error
    wrongStationBox: {
        backgroundColor: 'rgba(248,113,113,0.08)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(248,113,113,0.2)',
    },
    wrongStationLabel: {
        fontSize: 11,
        color: newTheme.colors.text3,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    wrongStationName: {
        fontSize: 18,
        fontWeight: '700',
        color: newTheme.colors.red,
    },
    wrongStationCity: {
        fontSize: 13,
        color: newTheme.colors.text2,
        marginTop: 2,
    },
});
