import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';

export default function CustomPicker({ label, value, placeholder, items = [], onSelect, disabled }) {
  const colors = useTheme();
  const [open, setOpen] = useState(false);
  const s = makeStyles(colors);

  const toggle = () => {
    if (!disabled) {
      console.log(`CustomPicker [${label}] toggling, items count: ${items.length}`);
      setOpen(!open);
    }
  };

  const select = (val) => {
    onSelect(val);
    setOpen(false);
  };

  return (
    <View style={s.wrapper}>
      {label ? <Text style={s.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[s.trigger, disabled && s.triggerDisabled]}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <Text style={[s.triggerText, !value && s.placeholder]}>
          {value || placeholder || 'Select...'}
        </Text>
        <Text style={s.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={s.dropdown}>
          <ScrollView
            style={s.list}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {items.length === 0 ? (
              <View style={s.item}>
                <Text style={s.itemText}>No options</Text>
              </View>
            ) : (
              items.map((item) => {
                const selected = item.label === value || item.value === value;
                return (
                  <TouchableOpacity
                    key={String(item.value)}
                    style={[s.item, selected && s.itemActive]}
                    onPress={() => select(item.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.itemText, selected && s.itemTextActive]}>
                      {item.label}
                    </Text>
                    {selected && <Text style={s.check}>✓</Text>}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    zIndex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  trigger: {
    height: 54,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerDisabled: {
    opacity: 0.45,
  },
  triggerText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  placeholder: {
    color: colors.text3,
  },
  arrow: {
    fontSize: 11,
    color: colors.text3,
    marginLeft: 8,
  },
  dropdown: {
    marginTop: 6,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  list: {
    maxHeight: 220,
    padding: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemActive: {
    borderColor: colors.amber,
    backgroundColor: colors.amberGlow,
  },
  itemText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  itemTextActive: {
    fontWeight: '700',
  },
  check: {
    fontSize: 16,
    color: colors.amber,
    fontWeight: '700',
  },
});
