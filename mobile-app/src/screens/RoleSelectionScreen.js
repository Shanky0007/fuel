import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { darkTheme } from '../theme/darkTheme';

const roles = [
    {
        id: 'user',
        title: 'User',
        subtitle: 'Join fuel queues & track your position',
        icon: '🚗',
        gradient: darkTheme.colors.gradientPrimary,
    },
    {
        id: 'operator',
        title: 'Operator',
        subtitle: 'Scan tickets & manage station queues',
        icon: '👷',
        gradient: darkTheme.colors.gradientSuccess,
    },
];

export default function RoleSelectionScreen({ onSelectRole }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={darkTheme.colors.background} />

            {/* Background glow effects */}
            <View style={styles.backgroundOverlay}>
                <View style={styles.gradientCircle1} />
                <View style={styles.gradientCircle2} />
            </View>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>⛽</Text>
                <Text style={styles.title}>Fuel Queue System</Text>
                <Text style={styles.subtitle}>Select your role to continue</Text>
            </View>

            {/* Role Cards */}
            <View style={styles.cardsContainer}>
                {roles.map((role) => (
                    <TouchableOpacity
                        key={role.id}
                        style={styles.cardWrapper}
                        onPress={() => onSelectRole(role.id)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={role.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.card}
                        >
                            <View style={styles.iconContainer}>
                                <Text style={styles.icon}>{role.icon}</Text>
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{role.title}</Text>
                                <Text style={styles.cardSubtitle}>{role.subtitle}</Text>
                            </View>
                            <View style={styles.arrowContainer}>
                                <Text style={styles.arrow}>→</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Powered by Smart Queue Management
                </Text>
            </View>
        </SafeAreaView>
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
        backgroundColor: darkTheme.colors.primaryGlow,
        opacity: 0.5,
    },
    gradientCircle2: {
        position: 'absolute',
        bottom: -150,
        right: -100,
        width: 500,
        height: 500,
        borderRadius: 250,
        backgroundColor: darkTheme.colors.accentGlow,
        opacity: 0.5,
    },
    header: {
        alignItems: 'center',
        paddingVertical: darkTheme.spacing.xxl,
        paddingHorizontal: darkTheme.spacing.lg,
    },
    logo: {
        fontSize: 64,
        marginBottom: darkTheme.spacing.md,
    },
    title: {
        fontSize: darkTheme.fontSize.xxxl,
        fontWeight: darkTheme.fontWeight.extrabold,
        color: darkTheme.colors.text,
        textAlign: 'center',
        marginBottom: darkTheme.spacing.sm,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: darkTheme.fontSize.md,
        color: darkTheme.colors.textSecondary,
        textAlign: 'center',
    },
    cardsContainer: {
        flex: 1,
        paddingHorizontal: darkTheme.spacing.lg,
        justifyContent: 'center',
        gap: darkTheme.spacing.lg,
    },
    cardWrapper: {
        ...darkTheme.shadows.large,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: darkTheme.spacing.lg,
        borderRadius: darkTheme.borderRadius.xl,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: darkTheme.borderRadius.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: darkTheme.spacing.md,
    },
    icon: {
        fontSize: 28,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: darkTheme.fontSize.xl,
        fontWeight: darkTheme.fontWeight.bold,
        color: darkTheme.colors.white,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: darkTheme.fontSize.sm,
        color: 'rgba(255, 255, 255, 0.85)',
    },
    arrowContainer: {
        width: 40,
        height: 40,
        borderRadius: darkTheme.borderRadius.round,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        fontSize: 20,
        color: darkTheme.colors.white,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: darkTheme.spacing.xl,
    },
    footerText: {
        fontSize: darkTheme.fontSize.sm,
        color: darkTheme.colors.textTertiary,
    },
});
