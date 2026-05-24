import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Spacing } from '@/constants/theme';

const COLORS = {
  textSoft: '#334155',
  slateLight: '#94A3B8',
  white: '#FFFFFF',
  orange: '#FF9F1C',
  border: '#E2E8F0',
  surface: '#F4F7FB',
};

export type FilterChipOption = {
  value: string;
  label: string;
  subtitle?: string;
};

type FilterChipsProps = {
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
  /** Equal-width row for fixed tabs, or compact horizontal scroll for dynamic lists */
  variant?: 'row' | 'scroll';
  activeColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function filterOptionsFromLabels(labels: readonly string[]): FilterChipOption[] {
  return labels.map((label) => ({ value: label, label }));
}

export function FilterChips({
  options,
  value,
  onChange,
  variant = 'row',
  activeColor = COLORS.orange,
  containerStyle,
}: FilterChipsProps) {
  const renderChip = (option: FilterChipOption) => {
    const isActive = option.value === value;

    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.chip,
          variant === 'row' ? styles.chipRow : styles.chipScroll,
          isActive && [
            styles.chipActive,
            { backgroundColor: activeColor, borderColor: activeColor, shadowColor: activeColor },
          ],
        ]}
        onPress={() => onChange(option.value)}
        activeOpacity={0.88}
      >
        <Text
          style={[styles.label, isActive && styles.labelActive]}
          numberOfLines={1}
          adjustsFontSizeToFit={variant === 'row'}
          minimumFontScale={0.85}
        >
          {option.label}
        </Text>
        {option.subtitle ? (
          <Text style={[styles.subtitle, isActive && styles.subtitleActive]} numberOfLines={1}>
            {option.subtitle}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (variant === 'scroll') {
    return (
      <View style={[styles.container, containerStyle]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollRow}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {options.map(renderChip)}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.row}>{options.map(renderChip)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    paddingTop: 2,
    paddingBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    gap: 6,
  },
  scrollRow: {
    paddingHorizontal: Spacing.four,
    gap: 6,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 36,
  },
  chipRow: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  chipScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
  },
  chipActive: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    color: COLORS.textSoft,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  labelActive: {
    color: COLORS.white,
  },
  subtitle: {
    marginTop: 2,
    color: COLORS.slateLight,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitleActive: {
    color: 'rgba(255,255,255,0.82)',
  },
});
