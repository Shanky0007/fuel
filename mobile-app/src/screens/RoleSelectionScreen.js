import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { newTheme } from '../theme/newTheme';

const roles = [
    {
        id: 'user',
        title: 'User',
        subtitle: 'Join fuel queues & track your position',
        icon: '🚗',
        color: newTheme.colors.blue,
    },
    {
        id: 'operator',
        title: 'Operator',
        subtitle: 'Scan tickets & manage station queues',
        icon: '👷',
        color: newTheme.colors.green,
    },
];

export default function RoleSelectionScreen({ onSelectRole }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={newTheme.colors.bg} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoIcon}>
                    <Text style={{ fontSize: 40 }}>⛽</Text>
                </View>
                <Text style={styles.title}>Fuel Queue System</Text>
                <Text style={styles.subtitle}>Select your role to continue</Text>
            </View>

            {/* Role Cards */}
            <View style={styles.cardsContainer}>
                {roles.map((role) => (
                    <TouchableOpacity
                        key={role.id}
                        style={styles.card}
                        onPress={() => onSelectRole(role.id)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: role.color + '20' }]}>
                            <Text style={styles.icon}>{role.icon}</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{role.title}</Text>
                            <Text style={styles.cardSubtitle}>{role.subtitle}</Text>
                        </View>
                        <View style={styles.arrowContainer}>
                            <Text style={styles.arrow}>→</Text>
                        </View>
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
        backgroundColor: newTheme.colors.bg,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 20,
    },
    logoIcon: {
        width: 80,
        height: 80,
        backgroundColor: newTheme.colors.amber,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: newTheme.colors.text,
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: newTheme.colors.text2,
        textAlign: 'center',
    },
    cardsContainer: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        backgroundColor: newTheme.colors.bg2,
        borderWidth: 1,
        borderColor: newTheme.colors.border,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    icon: {
        fontSize: 28,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: newTheme.colors.text,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: newTheme.colors.text2,
    },
    arrowContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: newTheme.colors.bg3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        fontSize: 20,
        color: newTheme.colors.text,
        fontWeight: '700',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    footerText: {
        fontSize: 12,
        color: newTheme.colors.text3,
    },
});
