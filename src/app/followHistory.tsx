import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { FilterChips } from '@/components/filter-chips';
import { getApiErrorMessage } from '@/services/api';
import {
  fetchMisSeguidos,
  type MisSeguidosResponse,
  type SeguimientoAtletaItem,
  type SeguimientoEventoItem,
  type SeguimientoPruebaItem,
} from '@/services/seguimientos';

const COLORS = {
  navy: '#061629',
  slate: '#64748B',
  slateLight: '#94A3B8',
  text: '#0F172A',
  white: '#FFFFFF',
  orange: '#FF9F1C',
  blue: '#208AEF',
  purple: '#8B5CF6',
  border: '#E2E8F0',
  surface: '#F4F7FB',
  red: '#EF4444',
};

const FILTERS = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'EVENTOS', label: 'Eventos' },
  { id: 'ATLETAS', label: 'Atletas' },
  { id: 'PRUEBAS', label: 'Competiciones' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

function formatFollowDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function FollowHistoryScreen() {
  const router = useRouter();
  const [data, setData] = useState<MisSeguidosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterId>('TODOS');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await fetchMisSeguidos();
      setData(response);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cargar tu historial de seguimientos'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const showEventos = activeFilter === 'TODOS' || activeFilter === 'EVENTOS';
  const showAtletas = activeFilter === 'TODOS' || activeFilter === 'ATLETAS';
  const showPruebas = activeFilter === 'TODOS' || activeFilter === 'PRUEBAS';

  const renderEvento = (item: SeguimientoEventoItem) => (
    <TouchableOpacity
      key={`evento-${item.id}`}
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/eventDetails', params: { eventId: item.id } })}
    >
      <Image source={{ uri: item.image }} style={styles.eventImage} contentFit="cover" />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: `${item.statusColor}20` }]}>
            <Text style={[styles.badgeText, { color: item.statusColor }]}>{item.status}</Text>
          </View>
          <Text style={styles.followDate}>{formatFollowDate(item.followedAt)}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMeta}>{item.date} · {item.location}</Text>
        <Text style={styles.cardSubMeta}>{item.tests} · {item.inscribed}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.slateLight} />
    </TouchableOpacity>
  );

  const renderAtleta = (item: SeguimientoAtletaItem) => (
    <TouchableOpacity
      key={`atleta-${item.id}`}
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/profile', params: { athleteId: item.id } })}
    >
      <Image source={{ uri: item.image }} style={styles.avatar} contentFit="cover" />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: `${item.categoryColor}20` }]}>
            <Text style={[styles.badgeText, { color: item.categoryColor }]}>{item.category}</Text>
          </View>
          <Text style={styles.followDate}>{formatFollowDate(item.followedAt)}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardMeta}>{item.specialty}</Text>
        <Text style={styles.cardSubMeta}>{item.club} · {item.medals} medallas</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.slateLight} />
    </TouchableOpacity>
  );

  const renderPrueba = (item: SeguimientoPruebaItem) => (
    <TouchableOpacity
      key={`prueba-${item.id}`}
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/competitionDetails', params: { eventoPruebaId: item.id } })}
    >
      <View style={[styles.iconBox, { backgroundColor: '#EEF4FF' }]}>
        <Ionicons name="stopwatch-outline" size={22} color={COLORS.blue} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: '#F3E8FF' }]}>
            <Text style={[styles.badgeText, { color: COLORS.purple }]}>{item.category}</Text>
          </View>
          <Text style={styles.followDate}>{formatFollowDate(item.followedAt)}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMeta}>{item.subtitle}</Text>
        <Text style={styles.cardSubMeta}>{item.date} · {item.time}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.slateLight} />
    </TouchableOpacity>
  );

  const isEmpty =
    !data ||
    ((showEventos ? data.eventos.length : 0) +
      (showAtletas ? data.atletas.length : 0) +
      (showPruebas ? data.pruebas.length : 0) ===
      0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HISTORIAL COMPLETO</Text>
        <View style={styles.headerButton} />
      </View>

      {data ? (
        <View style={styles.summaryRow}>
          <SummaryChip label="Total" value={data.resumen.total} color={COLORS.orange} />
          <SummaryChip label="Eventos" value={data.resumen.eventos} color={COLORS.blue} />
          <SummaryChip label="Atletas" value={data.resumen.atletas} color={COLORS.purple} />
          <SummaryChip label="Pruebas" value={data.resumen.pruebas} color={COLORS.navy} />
        </View>
      ) : null}

      <FilterChips
        options={FILTERS.map((filter) => ({ value: filter.id, label: filter.label }))}
        value={activeFilter}
        onChange={setActiveFilter}
        containerStyle={styles.filtersContainer}
      />

      {loading && !data ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.orange} />
          <Text style={styles.loadingText}>Cargando seguimientos...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadData(true)} tintColor={COLORS.orange} />
          }
        >
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isEmpty ? (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={42} color={COLORS.slateLight} />
              <Text style={styles.emptyTitle}>Sin seguimientos</Text>
              <Text style={styles.emptyText}>
                Sigue eventos, atletas o competiciones para verlos aquí.
              </Text>
            </View>
          ) : null}

          {showEventos && data && data.eventos.length > 0 ? (
            <View style={styles.section}>
              {activeFilter === 'TODOS' ? <Text style={styles.sectionTitle}>EVENTOS</Text> : null}
              {data.eventos.map(renderEvento)}
            </View>
          ) : null}

          {showAtletas && data && data.atletas.length > 0 ? (
            <View style={styles.section}>
              {activeFilter === 'TODOS' ? <Text style={styles.sectionTitle}>ATLETAS</Text> : null}
              {data.atletas.map(renderAtleta)}
            </View>
          ) : null}

          {showPruebas && data && data.pruebas.length > 0 ? (
            <View style={styles.section}>
              {activeFilter === 'TODOS' ? <Text style={styles.sectionTitle}>COMPETICIONES</Text> : null}
              {data.pruebas.map(renderPrueba)}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.summaryChip}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: COLORS.navy,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  summaryChip: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.slate,
    marginTop: 2,
  },
  filtersContainer: {
    backgroundColor: COLORS.surface,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  followDate: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.slateLight,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  cardMeta: {
    color: COLORS.slate,
    fontSize: 12,
    fontWeight: '600',
  },
  cardSubMeta: {
    color: COLORS.slateLight,
    fontSize: 11,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
});
