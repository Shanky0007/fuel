import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { newTheme } from '../theme/newTheme';

export default function BottomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const getIcon = () => {
          switch (route.name) {
            case 'StationList':
              return '🗺';
            case 'Ticket':
              return '🎫';
            case 'Settings':
              return '👤';
            default:
              return '•';
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            {isFocused && <View style={styles.tabDot} />}
            <Text style={styles.tabIcon}>{getIcon()}</Text>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 84,
    backgroundColor: 'rgba(13,14,18,0.95)',
    borderTopWidth: 1,
    borderTopColor: newTheme.colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: newTheme.colors.amber,
  },
  tabIcon: {
    fontSize: 22,
    lineHeight: 22,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: newTheme.colors.text3,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: newTheme.colors.amber,
  },
});
