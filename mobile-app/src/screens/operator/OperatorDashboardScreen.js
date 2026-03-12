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
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { OperatorAuthContext } from '../../context/OperatorAuthContext';
import { ticketService, operatorQueueService } from '../../services/operatorApi';
import { darkTheme } from '../../theme/darkTheme';


export default function OperatorDashboardScreen() {
    const { operator, logout } = useContext(OperatorAuthContext);
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
        loadQueue();
    }, [activeTab]);

    const loadQueue = async () => {
        try {
            const data = await operatorQueueService.getRegionalQueues();
            const activeQueues = (data || []).filter(q =>
                q.status === 'WAITING' || q.status === 'SERVING'
            );
            setQueue(activeQueues);
        } catch (error) {
            console.error('Failed to load queue:', error);
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
            setScanResult({
                success: false,
                message: error.response?.data?.error || 'Verification failed'
            });
            setTimeout(() => {
                setScanResult(null);
                hasScannedRef.current = false;
            }, 5000);
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
            setScanResult({
                success: false,
                message: error.response?.data?.error || 'Invalid verification code'
            });
            setTimeout(() => setScanResult(null), 5000);
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
            <StatusBar barStyle="light-content" backgroundColor={darkTheme.colors.background} />

            {/* Background glow effects */}
            <View style={styles.backgroundOverlay}>
                <View style={styles.gradientCircle1} />
                <View style={styles.gradientCircle2} />
            </View>

            {/* Header */}
            <SafeAreaView>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerIcon}>⛽</Text>
                        <View>
                            <Text style={styles.headerTitle}>Operator Dashboard</Text>
                            <Text style={styles.headerSubtitle}>Welcome, {operator?.name}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
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
                                >
                                    <LinearGradient
                                        colors={darkTheme.colors.gradientSuccess}
                                        style={styles.scanButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.scanButtonText}>Start Camera</Text>
                                    </LinearGradient>
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
                            placeholderTextColor={darkTheme.colors.textTertiary}
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
                        >
                            <LinearGradient
                                colors={verificationCode.length === 6 ? darkTheme.colors.gradientPrimary : [darkTheme.colors.disabled, darkTheme.colors.disabled]}
                                style={styles.verifyButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.verifyButtonText}>
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </Text>
                            </LinearGradient>
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
                                                            ? darkTheme.colors.error
                                                            : scanResult.data.fuelQuotaInfo.remaining < scanResult.data.fuelQuotaInfo.weeklyLimit * 0.2
                                                                ? darkTheme.colors.warning
                                                                : darkTheme.colors.success,
                                                    },
                                                ]} />
                                            </View>
                                        </View>
                                    )}
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
                            colors={[darkTheme.colors.primary]}
                            tintColor={darkTheme.colors.primary}
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
                                    <LinearGradient
                                        colors={darkTheme.colors.gradientPrimary}
                                        style={styles.positionBadge}
                                    >
                                        <Text style={styles.positionText}>#{index + 1}</Text>
                                    </LinearGradient>
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

                                <View style={styles.queueDetails}>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Customer:</Text>
                                        <Text style={styles.infoValue}>{item.user?.name || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Vehicle:</Text>
                                        <Text style={styles.infoValue}>{item.vehicle?.type || 'N/A'}</Text>
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
                                                        ? darkTheme.colors.error
                                                        : item.fuelQuotaInfo.remaining < item.fuelQuotaInfo.weeklyLimit * 0.2
                                                            ? darkTheme.colors.warning
                                                            : darkTheme.colors.success,
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
                                                            placeholderTextColor={darkTheme.colors.textTertiary}
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
                                                >
                                                    <LinearGradient
                                                        colors={darkTheme.colors.gradientSuccess}
                                                        style={styles.completeButtonGradient}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                    >
                                                        <Text style={styles.completeButtonText}>
                                                            ✅ Dispense {getFuelAmountForItem(item)}L & Complete
                                                        </Text>
                                                    </LinearGradient>
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
        backgroundColor: darkTheme.colors.background,
    },
    backgroundOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    gradientCircle1: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: darkTheme.colors.successGlow,
        opacity: 0.3,
    },
    gradientCircle2: {
        position: 'absolute',
        bottom: -150,
        right: -100,
        width: 500,
        height: 500,
        borderRadius: 250,
        backgroundColor: darkTheme.colors.primaryGlow,
        opacity: 0.3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: darkTheme.spacing.lg,
        paddingVertical: darkTheme.spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 36,
        marginRight: darkTheme.spacing.md,
    },
    headerTitle: {
        fontSize: darkTheme.fontSize.lg,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.text,
    },
    headerSubtitle: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.textSecondary,
    },
    logoutButton: {
        backgroundColor: darkTheme.colors.card,
        paddingHorizontal: darkTheme.spacing.md,
        paddingVertical: darkTheme.spacing.sm,
        borderRadius: darkTheme.borderRadius.md,
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
    },
    logoutText: {
        color: darkTheme.colors.error,
        fontWeight: darkTheme.fontWeight.semibold,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: darkTheme.colors.surface,
        marginHorizontal: darkTheme.spacing.lg,
        marginVertical: darkTheme.spacing.md,
        borderRadius: darkTheme.borderRadius.lg,
        padding: darkTheme.spacing.xs,
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: darkTheme.spacing.md,
        alignItems: 'center',
        borderRadius: darkTheme.borderRadius.md,
    },
    tabActive: {
        backgroundColor: darkTheme.colors.card,
    },
    tabText: {
        color: darkTheme.colors.textSecondary,
        fontWeight: darkTheme.fontWeight.semibold,
        fontSize: darkTheme.fontSize.sm,
    },
    tabTextActive: {
        color: darkTheme.colors.primary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: darkTheme.spacing.lg,
        gap: darkTheme.spacing.lg,
    },
    card: {
        backgroundColor: darkTheme.colors.surface,
        borderRadius: darkTheme.borderRadius.xl,
        padding: darkTheme.spacing.lg,
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
        ...darkTheme.shadows.medium,
    },
    cardTitle: {
        fontSize: darkTheme.fontSize.lg,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.text,
        marginBottom: darkTheme.spacing.md,
    },
    cameraContainer: {
        borderRadius: darkTheme.borderRadius.md,
        overflow: 'hidden',
    },
    camera: {
        height: 300,
        borderRadius: darkTheme.borderRadius.md,
    },
    stopButton: {
        backgroundColor: darkTheme.colors.error,
        paddingVertical: darkTheme.spacing.md,
        alignItems: 'center',
        marginTop: darkTheme.spacing.md,
        borderRadius: darkTheme.borderRadius.md,
    },
    stopButtonText: {
        color: darkTheme.colors.white,
        fontWeight: darkTheme.fontWeight.semibold,
    },
    scannerPlaceholder: {
        alignItems: 'center',
        paddingVertical: darkTheme.spacing.xl,
    },
    scannerIcon: {
        fontSize: 64,
        marginBottom: darkTheme.spacing.md,
    },
    scannerText: {
        color: darkTheme.colors.textSecondary,
        marginBottom: darkTheme.spacing.lg,
    },
    scanButton: {
        borderRadius: darkTheme.borderRadius.md,
        overflow: 'hidden',
        ...darkTheme.shadows.medium,
    },
    scanButtonGradient: {
        paddingVertical: darkTheme.spacing.md,
        paddingHorizontal: darkTheme.spacing.xl,
    },
    scanButtonText: {
        color: darkTheme.colors.white,
        fontWeight: darkTheme.fontWeight.bold,
        fontSize: darkTheme.fontSize.md,
    },
    codeHint: {
        color: darkTheme.colors.textSecondary,
        fontSize: darkTheme.fontSize.sm,
        marginBottom: darkTheme.spacing.md,
    },
    codeInput: {
        backgroundColor: darkTheme.colors.card,
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
        borderRadius: darkTheme.borderRadius.md,
        padding: darkTheme.spacing.md,
        fontSize: darkTheme.fontSize.xl,
        textAlign: 'center',
        letterSpacing: 8,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.text,
        marginBottom: darkTheme.spacing.md,
    },
    verifyButton: {
        borderRadius: darkTheme.borderRadius.md,
        overflow: 'hidden',
    },
    verifyButtonDisabled: {
        opacity: 0.6,
    },
    verifyButtonGradient: {
        paddingVertical: darkTheme.spacing.md,
        alignItems: 'center',
    },
    verifyButtonText: {
        color: darkTheme.colors.white,
        fontWeight: darkTheme.fontWeight.bold,
    },
    resultCard: {
        padding: darkTheme.spacing.lg,
        borderRadius: darkTheme.borderRadius.xl,
        borderWidth: 1,
    },
    resultSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: darkTheme.colors.success,
    },
    resultError: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: darkTheme.colors.error,
    },
    resultTitleSuccess: {
        fontSize: darkTheme.fontSize.lg,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.success,
        marginBottom: darkTheme.spacing.sm,
    },
    resultTitleError: {
        fontSize: darkTheme.fontSize.lg,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.error,
        marginBottom: darkTheme.spacing.sm,
    },
    resultText: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.textSecondary,
    },
    resultTextError: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.errorLight,
    },
    queueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    refreshButton: {
        backgroundColor: darkTheme.colors.card,
        paddingHorizontal: darkTheme.spacing.md,
        paddingVertical: darkTheme.spacing.sm,
        borderRadius: darkTheme.borderRadius.md,
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
    },
    refreshButtonText: {
        color: darkTheme.colors.textSecondary,
        fontWeight: darkTheme.fontWeight.semibold,
    },
    emptyState: {
        backgroundColor: darkTheme.colors.surface,
        padding: darkTheme.spacing.xxl,
        borderRadius: darkTheme.borderRadius.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: darkTheme.spacing.md,
    },
    emptyTitle: {
        fontSize: darkTheme.fontSize.lg,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.text,
        marginBottom: darkTheme.spacing.xs,
    },
    emptyText: {
        color: darkTheme.colors.textSecondary,
    },
    queueCard: {
        backgroundColor: darkTheme.colors.surface,
        padding: darkTheme.spacing.lg,
        borderRadius: darkTheme.borderRadius.xl,
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
        ...darkTheme.shadows.medium,
    },
    queueCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: darkTheme.spacing.md,
    },
    positionBadge: {
        paddingHorizontal: darkTheme.spacing.md,
        paddingVertical: darkTheme.spacing.xs,
        borderRadius: darkTheme.borderRadius.round,
    },
    positionText: {
        color: darkTheme.colors.white,
        fontWeight: darkTheme.fontWeight.bold,
    },
    statusBadge: {
        paddingHorizontal: darkTheme.spacing.md,
        paddingVertical: darkTheme.spacing.xs,
        borderRadius: darkTheme.borderRadius.round,
    },
    statusServing: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    statusWaiting: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
    },
    statusText: {
        fontSize: darkTheme.fontSize.xs,
        fontWeight: darkTheme.fontWeight.bold,
    },
    statusTextServing: {
        color: darkTheme.colors.success,
    },
    statusTextWaiting: {
        color: darkTheme.colors.warning,
    },
    queueDetails: {
        gap: darkTheme.spacing.sm,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
    },
    infoLabel: {
        color: darkTheme.colors.textSecondary,
        fontWeight: darkTheme.fontWeight.medium,
        fontSize: darkTheme.fontSize.sm,
    },
    infoValue: {
        color: darkTheme.colors.text,
        fontWeight: darkTheme.fontWeight.semibold,
        fontSize: darkTheme.fontSize.sm,
    },
    quotaResultBox: {
        marginTop: darkTheme.spacing.md,
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderRadius: darkTheme.borderRadius.md,
        padding: darkTheme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(6, 182, 212, 0.3)',
    },
    quotaResultTitle: {
        fontSize: darkTheme.fontSize.sm,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.primary,
        marginBottom: darkTheme.spacing.xs,
    },
    quotaResultText: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.textSecondary,
        marginBottom: 2,
    },
    quotaProgressBarBg: {
        height: 8,
        backgroundColor: darkTheme.colors.card,
        borderRadius: 4,
        marginTop: darkTheme.spacing.sm,
        overflow: 'hidden',
    },
    quotaProgressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    quotaSection: {
        marginTop: darkTheme.spacing.md,
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        borderRadius: darkTheme.borderRadius.md,
        padding: darkTheme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(6, 182, 212, 0.2)',
    },
    quotaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: darkTheme.spacing.sm,
    },
    quotaSectionTitle: {
        fontSize: darkTheme.fontSize.sm,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.primary,
    },
    quotaRemainingBadge: {
        paddingHorizontal: darkTheme.spacing.sm,
        paddingVertical: 2,
        borderRadius: darkTheme.borderRadius.round,
    },
    quotaBadgeOk: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    quotaBadgeWarning: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
    },
    quotaBadgeDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    quotaBadgeText: {
        fontSize: darkTheme.fontSize.xs,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.text,
    },
    quotaDetailText: {
        fontSize: darkTheme.fontSize.xs,
        color: darkTheme.colors.textTertiary,
        marginTop: darkTheme.spacing.xs,
    },
    quotaExhaustedBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: darkTheme.borderRadius.md,
        padding: darkTheme.spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    quotaExhaustedIcon: {
        fontSize: 36,
        marginBottom: darkTheme.spacing.sm,
    },
    quotaExhaustedTitle: {
        fontSize: darkTheme.fontSize.md,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.error,
        marginBottom: darkTheme.spacing.xs,
    },
    quotaExhaustedText: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.textSecondary,
        textAlign: 'center',
    },
    completionSection: {
        marginTop: darkTheme.spacing.md,
        paddingTop: darkTheme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: darkTheme.colors.border,
        gap: darkTheme.spacing.md,
    },
    fuelInputGroup: {
        gap: darkTheme.spacing.xs,
    },
    fuelInputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fuelInputLabel: {
        color: darkTheme.colors.textSecondary,
        fontWeight: darkTheme.fontWeight.semibold,
        fontSize: darkTheme.fontSize.sm,
    },
    fuelInputMax: {
        color: darkTheme.colors.warning,
        fontWeight: darkTheme.fontWeight.bold,
        fontSize: darkTheme.fontSize.xs,
    },
    fuelInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: darkTheme.spacing.sm,
    },
    fuelInput: {
        flex: 1,
        backgroundColor: darkTheme.colors.card,
        borderWidth: 2,
        borderColor: darkTheme.colors.border,
        borderRadius: darkTheme.borderRadius.md,
        padding: darkTheme.spacing.md,
        fontSize: darkTheme.fontSize.lg,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.text,
        textAlign: 'center',
    },
    fuelUnit: {
        fontSize: darkTheme.fontSize.lg,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.textSecondary,
    },
    fuelOverLimitWarning: {
        color: darkTheme.colors.error,
        fontSize: darkTheme.fontSize.xs,
        fontWeight: darkTheme.fontWeight.semibold,
        marginTop: 2,
    },
    completeButton: {
        borderRadius: darkTheme.borderRadius.md,
        overflow: 'hidden',
    },
    completeButtonGradient: {
        paddingVertical: darkTheme.spacing.md,
        alignItems: 'center',
    },
    completeButtonText: {
        color: darkTheme.colors.white,
        fontWeight: darkTheme.fontWeight.bold,
        fontSize: darkTheme.fontSize.md,
    },
});
