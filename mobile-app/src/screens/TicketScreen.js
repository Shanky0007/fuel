import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { darkTheme } from '../theme/darkTheme';

export default function TicketScreen({ route, navigation }) {
    const { ticket, queue, position } = route.params;
    const [ticketInfo, setTicketInfo] = useState(null);

    useEffect(() => {
        if (ticket && ticket.qrCodeData) {
            try {
                const parsedData = JSON.parse(ticket.qrCodeData);
                setTicketInfo(parsedData);
            } catch (error) {
                console.error('Error parsing ticket data:', error);
            }
        }
    }, [ticket]);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your E-Ticket</Text>
                    <Text style={styles.subtitle}>Show this to the operator</Text>
                </View>

                <View style={styles.ticketCard}>
                    {/* QR Code Section */}
                    <View style={styles.qrSection}>
                        <View style={styles.qrContainer}>
                            <QRCode
                                value={ticket?.qrCodeData || 'No data'}
                                size={220}
                                color={darkTheme.colors.text}
                                backgroundColor={darkTheme.colors.surface}
                            />
                        </View>

                        {/* Verification Code Display */}
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

                    {/* Ticket Info */}
                    <View style={styles.infoSection}>
                        <View style={styles.positionBadge}>
                            <Text style={styles.positionLabel}>Queue Position</Text>
                            <Text style={styles.positionValue}>#{position || '?'}</Text>
                        </View>

                        {ticketInfo && (
                            <View style={styles.detailsContainer}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Station:</Text>
                                    <Text style={styles.detailValue}>{ticketInfo.stationName}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Location:</Text>
                                    <Text style={styles.detailValue}>
                                        {ticketInfo.stationRegion}, {ticketInfo.stationCountry}
                                    </Text>
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

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerDot} />
                        <View style={styles.dividerLine} />
                        <View style={styles.dividerDot} />
                    </View>

                    {/* Instructions */}
                    <View style={styles.instructionsSection}>
                        <Text style={styles.instructionsTitle}>How to use:</Text>
                        <View style={styles.instructionItem}>
                            <Text style={styles.instructionNumber}>1</Text>
                            <Text style={styles.instructionText}>Arrive at the station</Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Text style={styles.instructionNumber}>2</Text>
                            <Text style={styles.instructionText}>Show QR code to operator</Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Text style={styles.instructionNumber}>3</Text>
                            <Text style={styles.instructionText}>Get your fuel and go!</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('StationList')}
                    >
                        <Text style={styles.secondaryButtonText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkTheme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: darkTheme.spacing.lg,
        paddingTop: darkTheme.spacing.xxl,
    },
    header: {
        alignItems: 'center',
        marginBottom: darkTheme.spacing.xl,
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
    ticketCard: {
        backgroundColor: darkTheme.colors.card,
        borderRadius: darkTheme.borderRadius.xl,
        padding: darkTheme.spacing.xl,
        ...darkTheme.shadows.large,
    },
    qrSection: {
        alignItems: 'center',
        marginBottom: darkTheme.spacing.xl,
    },
    qrContainer: {
        padding: darkTheme.spacing.lg,
        backgroundColor: darkTheme.colors.surface,
        borderRadius: darkTheme.borderRadius.lg,
        ...darkTheme.shadows.medium,
    },
    verificationContainer: {
        marginTop: darkTheme.spacing.lg,
        alignItems: 'center',
    },
    verificationLabel: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.textSecondary,
        fontWeight: darkTheme.fontWeight.medium,
        marginBottom: darkTheme.spacing.sm,
    },
    verificationCodeBox: {
        backgroundColor: darkTheme.colors.surface,
        borderRadius: darkTheme.borderRadius.md,
        paddingVertical: darkTheme.spacing.md,
        paddingHorizontal: darkTheme.spacing.xl,
        borderWidth: 2,
        borderColor: darkTheme.colors.primary,
        borderStyle: 'dashed',
    },
    verificationCode: {
        fontSize: 28,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.primary,
        letterSpacing: 4,
        fontFamily: 'monospace',
    },
    verificationHint: {
        marginTop: darkTheme.spacing.sm,
        fontSize: darkTheme.fontSize.xs,
        color: darkTheme.colors.textTertiary,
        textAlign: 'center',
    },
    infoSection: {
        gap: darkTheme.spacing.md,
        marginBottom: darkTheme.spacing.lg,
    },
    positionBadge: {
        backgroundColor: darkTheme.colors.primary,
        borderRadius: darkTheme.borderRadius.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: darkTheme.spacing.md,
    },
    positionLabel: {
        fontSize: darkTheme.fontSize.md,
        fontWeight: darkTheme.fontWeight.semibold,
        color: darkTheme.colors.text,
    },
    positionValue: {
        fontSize: darkTheme.fontSize.xxxl,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.text,
    },
    detailsContainer: {
        backgroundColor: darkTheme.colors.surface,
        borderRadius: darkTheme.borderRadius.md,
        padding: darkTheme.spacing.md,
        gap: darkTheme.spacing.sm,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: darkTheme.spacing.xs,
    },
    detailLabel: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.textSecondary,
        fontWeight: darkTheme.fontWeight.medium,
    },
    detailValue: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.text,
        fontWeight: darkTheme.fontWeight.semibold,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: darkTheme.spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 2,
        backgroundColor: darkTheme.colors.border,
    },
    dividerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: darkTheme.colors.border,
    },
    instructionsSection: {
        gap: darkTheme.spacing.md,
    },
    instructionsTitle: {
        fontSize: darkTheme.fontSize.md,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.text,
        marginBottom: darkTheme.spacing.xs,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: darkTheme.spacing.md,
    },
    instructionNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: darkTheme.colors.primary,
        color: darkTheme.colors.text,
        fontSize: darkTheme.fontSize.sm,
        fontWeight: darkTheme.fontWeight.bold,
        textAlign: 'center',
        lineHeight: 28,
    },
    instructionText: {
        flex: 1,
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.textSecondary,
    },
    actions: {
        marginTop: darkTheme.spacing.xl,
        gap: darkTheme.spacing.md,
    },
    secondaryButton: {
        backgroundColor: darkTheme.colors.surface,
        padding: darkTheme.spacing.md,
        borderRadius: darkTheme.borderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: darkTheme.colors.border,
    },
    secondaryButtonText: {
        color: darkTheme.colors.text,
        fontWeight: darkTheme.fontWeight.bold,
        fontSize: darkTheme.fontSize.md,
    },
});
