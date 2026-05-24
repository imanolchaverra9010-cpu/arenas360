import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { FilterChips, filterOptionsFromLabels } from '@/components/filter-chips';
import { NotificationBell } from '@/components/notification-bell';
import { OfflineBanner } from '@/components/offline-banner';
import { apiGetCached, peekCacheForPath } from '@/services/cached-api';
import { getApiErrorMessage } from '@/services/api';
const { width } = Dimensions.get('window');

const COLORS = {
  navy: '#061629',
  navySoft: '#0C223D',
  navyDeep: '#04101E',
  slate: '#64748B',
  slateLight: '#94A3B8',
  text: '#0F172A',
  textSoft: '#334155',
  white: '#FFFFFF',
  orange: '#FF9F1C',
  orangeSoft: '#FFB84D',
  orangeDeep: '#F97316',
  green: '#10B981',
  blue: '#208AEF',
  border: '#E2E8F0',
  surface: '#F4F7FB',
  surfaceAlt: '#EEF2F7',
  shadow: '#0F172A',
};

const SEARCH_FILTERS = ['TODOS', 'ACTIVOS', 'INACTIVOS', 'NUEVOS'] as const;

type AthleteItem = {
  id: string;
  name: string;
  specialty: string;
  category: string;
  categoryColor: string;
  image: string;
  medals: string;
  records: string;
  status: string;
  statusColor: string;
  bestTime: string;
  club: string;
  rating: string;
  isNew?: boolean;
};

type AthletesSummary = {
  total: number;
  totalMedals: number;
  totalRecords: number;
};

export default function AthletesScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [athletes, setAthletes] = useState<AthleteItem[]>([]);
  const [summary, setSummary] = useState<AthletesSummary>({
    total: 0,
    totalMedals: 0,
    totalRecords: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCount = athletes.filter((a) => a.status === 'ACTIVO').length;

  const loadAthletes = useCallback(
    async (query = searchQuery, filterIndex = activeFilter, forceNetwork = false) => {
      setError('');

      const params = new URLSearchParams();
      params.set('filtro', SEARCH_FILTERS[filterIndex]);
      if (query.trim()) {
        params.set('q', query.trim());
      }
      const path = `/api/atletas/?${params.toString()}`;

      if (!forceNetwork) {
        const cached = await peekCacheForPath<{ athletes: AthleteItem[]; summary: AthletesSummary }>(path);
        if (cached) {
          setFromCache(true);
          setAthletes((cached.data.athletes || []) as AthleteItem[]);
          setSummary(cached.data.summary || { total: 0, totalMedals: 0, totalRecords: 0 });
          setLoading(false);
        } else {
          setLoading(true);
        }
      }

      try {
        const result = await apiGetCached<{ athletes: AthleteItem[]; summary: AthletesSummary }>(
          path,
          true,
          { forceNetwork }
        );

        setFromCache(result.fromCache);
        setAthletes((result.data.athletes || []) as AthleteItem[]);
        setSummary(result.data.summary || { total: 0, totalMedals: 0, totalRecords: 0 });
      } catch (err) {
        const message = getApiErrorMessage(err);
        if (forceNetwork || !athletes.length) {
          setError(message);
          setAthletes([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter, athletes.length, searchQuery]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadAthletes(searchQuery, activeFilter, true);
  }, [activeFilter, loadAthletes, searchQuery]);

  useEffect(() => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }
    searchTimer.current = setTimeout(() => {
      loadAthletes(searchQuery, activeFilter);
    }, searchQuery ? 400 : 0);
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, [searchQuery, activeFilter, loadAthletes]);

  useEffect(() => {
    if (!loading && !error) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, error, athletes, fadeAnim]);

  const renderAthleteCard = (athlete: AthleteItem, index: number) => (
    <Animated.View
      key={athlete.id}
      style={[
        styles.animatedCard,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [24 + index * 8, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.athleteCard}
        activeOpacity={0.92}
        onPress={() => router.push({ pathname: '/profile', params: { athleteId: athlete.id } })}
      >
        {/* Image section */}
        <View style={styles.imageSection}>
          <Image source={{ uri: athlete.image }} style={styles.athleteImage} />
          <View style={[styles.statusBadge, { backgroundColor: athlete.statusColor }]}>
            <Ionicons
              name={athlete.status === 'ACTIVO' ? 'checkmark-circle' : 'close-circle'}
              size={12}
              color={COLORS.white}
            />
            <Text style={styles.statusBadgeText}>{athlete.status}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.athleteName}>{athlete.name}</Text>

          <View style={[styles.categoryBadge, { borderColor: athlete.categoryColor }]}>
            <Text style={[styles.categoryText, { color: athlete.categoryColor }]}>
              {athlete.category}
            </Text>
          </View>

          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <View style={styles.metaIconWrap}>
                <Ionicons name="water-outline" size={14} color={COLORS.orange} />
              </View>
              <Text style={styles.metaText}>{athlete.specialty}</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaIconWrap}>
                <Ionicons name="home-outline" size={14} color={COLORS.slateLight} />
              </View>
              <Text style={styles.metaText}>{athlete.club}</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaIconWrap}>
                <Ionicons name="timer-outline" size={14} color={COLORS.green} />
              </View>
              <Text style={[styles.metaText, { color: COLORS.green, fontWeight: '700' }]}>
                Mejor tiempo: {athlete.bestTime}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Ionicons name="medal-outline" size={14} color={COLORS.orange} />
              <Text style={styles.statText}>{athlete.medals} Medallas</Text>
            </View>
            <View style={[styles.statChip, styles.statChipAlt]}>
              <Ionicons name="flash-outline" size={14} color={COLORS.green} />
              <Text style={styles.statTextAlt}>{athlete.records} Récords</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.88}
              onPress={() => router.push({ pathname: '/profile', params: { athleteId: athlete.id } })}
            >
              <Ionicons name="eye-outline" size={14} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Ver Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.logoText}>ARENAS</Text>
            <Text style={styles.logoSubtext}>360</Text>
          </View>
        </View>
        <NotificationBell />
      </View>

      <OfflineBanner refreshing={refreshing} />

      <ScrollView
        stickyHeaderIndices={[2]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF9F1C" colors={['#FF9F1C']} />
        }
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroPill}>
            <Ionicons name="person-outline" size={14} color={COLORS.orangeDeep} />
            <Text style={styles.heroPillText}>REGISTRO Y GESTIÓN</Text>
          </View>
          <Text style={styles.title}>
            NUESTROS <Text style={styles.titleOrange}>ATLETAS</Text>
          </Text>
          <Text style={styles.subtitle}>
            {loading ? 'Cargando atletas...' : `${summary.total} atletas encontrados`}
          </Text>
          <View style={styles.decorativeLine} />
        </View>

        {/* Summary Row */}
        {!loading && error === '' && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{summary.total}</Text>
              <Text style={styles.summaryLabel}>Registrados</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{activeCount}</Text>
              <Text style={styles.summaryLabel}>Activos</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{summary.totalRecords}</Text>
              <Text style={styles.summaryLabel}>Récords</Text>
            </View>
          </View>
        )}

        {/* Sticky Filters + Search */}
        <View style={styles.filtersContainer}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={COLORS.slateLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar atleta..."
              placeholderTextColor={COLORS.slateLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.slateLight} />
              </TouchableOpacity>
            )}
          </View>

          <FilterChips
            options={filterOptionsFromLabels(SEARCH_FILTERS)}
            value={SEARCH_FILTERS[activeFilter]}
            onChange={(nextValue) => {
              const index = SEARCH_FILTERS.indexOf(nextValue as (typeof SEARCH_FILTERS)[number]);
              if (index >= 0) {
                setActiveFilter(index);
              }
            }}
            containerStyle={styles.filtersChips}
          />
        </View>

        {/* Athletes List */}
        <View style={styles.listContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.orange} />
              <Text style={styles.loadingText}>Cargando atletas...</Text>
            </View>
          )}

          {!loading && error !== '' && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="cloud-offline-outline" size={34} color={COLORS.slateLight} />
              </View>
              <Text style={styles.emptyTitle}>No se pudieron cargar los atletas</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadAthletes(searchQuery, activeFilter)}
                activeOpacity={0.85}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading &&
            error === '' &&
            athletes.map((athlete, index) => renderAthleteCard(athlete, index))}

          {!loading && error === '' && athletes.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="person-outline" size={34} color={COLORS.slateLight} />
              </View>
              <Text style={styles.emptyTitle}>Sin atletas encontrados</Text>
              <Text style={styles.emptyText}>
                Prueba otro filtro o término de búsqueda.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  // ─── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'android' ? 12 : 2,
    paddingBottom: Spacing.three,
    backgroundColor: COLORS.navy,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 10,
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  logoBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },

  logoImage: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },

  logoText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.2,
  },

  logoSubtext: {
    color: COLORS.orangeSoft,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 1,
  },

  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // ─── Hero Card ────────────────────────────────────────────────────────────
  heroCard: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
    paddingVertical: 24,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 5,
  },

  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#FFF5E8',
    borderWidth: 1,
    borderColor: '#FFE2B8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 14,
  },

  heroPillText: {
    color: COLORS.orangeDeep,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  title: {
    fontSize: 31,
    fontWeight: '900',
    fontStyle: 'italic',
    color: COLORS.text,
    letterSpacing: -1,
    lineHeight: 36,
  },

  titleOrange: {
    color: COLORS.orange,
  },

  subtitle: {
    color: COLORS.slate,
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  decorativeLine: {
    height: 5,
    width: 84,
    backgroundColor: COLORS.orange,
    borderRadius: 999,
    marginTop: 16,
  },

  // ─── Summary Row ──────────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.045,
    shadowRadius: 14,
    elevation: 2,
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: -0.4,
  },

  summaryLabel: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ─── Sticky Filters + Search ──────────────────────────────────────────────
  filtersContainer: {
    backgroundColor: COLORS.surface,
    paddingBottom: Spacing.three,
    paddingTop: Spacing.two,
    zIndex: 10,
  },

  filtersChips: {
    marginTop: 4,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },

  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },

  // ─── List ─────────────────────────────────────────────────────────────────
  listContainer: {
    paddingHorizontal: Spacing.four,
    gap: 20,
  },

  animatedCard: {
    marginBottom: 2,
  },

  // ─── Athlete Card ─────────────────────────────────────────────────────────
  athleteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },

  imageSection: {
    alignItems: 'center',
    paddingTop: Spacing.four,
    paddingBottom: 4,
    position: 'relative',
  },

  athleteImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.orange,
  },

  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: width * 0.15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  statusBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  infoContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: 12,
  },

  athleteName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  categoryBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#FFF8EE',
  },

  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  metaBlock: {
    gap: 10,
    marginTop: 2,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  metaIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  metaText: {
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },

  // ─── Stats chips ──────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },

  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 159, 28, 0.10)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.25)',
  },

  statChipAlt: {
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderColor: 'rgba(16,185,129,0.25)',
  },

  statText: {
    color: COLORS.orangeDeep,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  statTextAlt: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ─── Action Buttons ───────────────────────────────────────────────────────
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.orange,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },

  actionButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ─── Empty State ──────────────────────────────────────────────────────────
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 26,
    paddingVertical: 42,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },

  emptyIconWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyText: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 14,
  },

  loadingText: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: '600',
  },

  retryButton: {
    marginTop: 8,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
  },

  retryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
});