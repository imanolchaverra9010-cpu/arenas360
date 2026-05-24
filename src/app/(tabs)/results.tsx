import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

const RESULT_FILTERS = ['TODOS', 'RECIENTES', 'DESTACADOS', 'RÉCORDS'] as const;

type PodiumMember = {
  position: number;
  athlete: string;
  club: string;
  time: string;
  image: string;
  isRecord: boolean;
  recordType?: string;
  deportistaId?: string | null;
};

type ResultItem = {
  id: string;
  competitionId: string;
  event: string;
  category: string;
  podium: PodiumMember[];
};

type Competition = {
  id: string;
  name: string;
  date: string;
  location: string;
};

type ResultsSummary = {
  eventos: number;
  records: number;
  participantes: number;
  pruebas: number;
};

export default function ResultsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState(0);
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [summary, setSummary] = useState<ResultsSummary>({
    eventos: 0,
    records: 0,
    participantes: 0,
    pruebas: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const loadResults = useCallback(
    async (eventoId?: string, filterIndex = activeFilter) => {
      setError('');

      const params = new URLSearchParams();
      params.set('filtro', RESULT_FILTERS[filterIndex]);
      if (eventoId) {
        params.set('evento_id', eventoId);
      }
      const path = `/api/resultados/?${params.toString()}`;

      const cached = await peekCacheForPath<{
        competitions: Competition[];
        summary: ResultsSummary;
        results: ResultItem[];
      }>(path);
      if (cached) {
        const comps = (cached.data.competitions || []) as Competition[];
        setFromCache(true);
        setCompetitions(comps);
        setSummary(cached.data.summary || { eventos: 0, records: 0, participantes: 0, pruebas: 0 });
        setResults((cached.data.results || []) as ResultItem[]);
        setSelectedCompetition(eventoId || comps[0]?.id || '');
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const result = await apiGetCached<{
          competitions: Competition[];
          summary: ResultsSummary;
          results: ResultItem[];
        }>(path);

        const comps = (result.data.competitions || []) as Competition[];
        setFromCache(result.fromCache);
        setCompetitions(comps);
        setSummary(result.data.summary || { eventos: 0, records: 0, participantes: 0, pruebas: 0 });
        setResults((result.data.results || []) as ResultItem[]);

        const activeId = eventoId || comps[0]?.id || '';
        setSelectedCompetition(activeId);
      } catch (err) {
        const message = getApiErrorMessage(err, 'No se pudieron cargar los resultados');
        setError(message);
        setCompetitions([]);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [activeFilter]
  );

  useEffect(() => {
    loadResults();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, error, results, fadeAnim, slideAnim]);

  const handleCompetitionChange = (competitionId: string) => {
    setSelectedCompetition(competitionId);
    loadResults(competitionId, activeFilter);
  };

  const handleFilterChange = (index: number) => {
    setActiveFilter(index);
    if (selectedCompetition) {
      loadResults(selectedCompetition, index);
    } else {
      loadResults(undefined, index);
    }
  };

  const filteredResults = results.filter(
    (result) => !selectedCompetition || result.competitionId === selectedCompetition
  );

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1: return COLORS.gold;
      case 2: return COLORS.silver;
      case 3: return COLORS.bronze;
      default: return COLORS.slateLight;
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return 'trophy';
      case 2: return 'medal';
      case 3: return 'medal';
      default: return 'ribbon';
    }
  };

  const renderPodiumMember = (member: PodiumMember, index: number) => {
    const isFirst = member.position === 1;
    const Wrapper = member.deportistaId ? TouchableOpacity : View;

    return (
      <Wrapper
        key={index}
        style={[
          styles.podiumMember,
          isFirst && styles.podiumMemberFirst,
        ]}
        {...(member.deportistaId
          ? {
              activeOpacity: 0.85,
              onPress: () =>
                router.push({ pathname: '/profile', params: { athleteId: member.deportistaId! } }),
            }
          : {})}
      >
        {/* Medal */}
        <View style={[styles.medalContainer, { backgroundColor: getMedalColor(member.position) }]}>
          <Ionicons
            name={getMedalIcon(member.position)}
            size={22}
            color={member.position === 1 ? COLORS.navyDeep : COLORS.white}
          />
        </View>

        {/* Position Badge */}
        <View style={[styles.positionBadge, { backgroundColor: getMedalColor(member.position) }]}>
          <Text style={styles.positionText}>{member.position}º</Text>
        </View>

        {/* Athlete Image */}
        <Image source={{ uri: member.image }} style={styles.podiumImage} />

        {/* Athlete Info */}
        <Text style={styles.podiumAthleteName}>{member.athlete}</Text>
        <Text style={styles.podiumClub}>{member.club}</Text>

        {/* Time */}
        <View style={styles.timeContainer}>
          <Ionicons name="timer-outline" size={13} color={COLORS.orange} />
          <Text style={styles.timeText}>{member.time}</Text>
        </View>

        {/* Record Badge */}
        {member.isRecord && (
          <View style={styles.recordBadge}>
            <Ionicons name="flash" size={11} color={COLORS.white} />
            <Text style={styles.recordText}>{member.recordType}</Text>
          </View>
        )}
      </Wrapper>
    );
  };

  const renderResultCard = (result: ResultItem, index: number) => (
    <Animated.View
      key={result.id}
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30 + index * 10, 0],
            }),
          },
        ],
      }}
    >
      <View style={styles.resultCard}>
        {/* Event Header */}
        <View style={styles.eventHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventName}>{result.event}</Text>
            <Text style={styles.eventCategory}>{result.category}</Text>
          </View>
          <View style={styles.eventBadge}>
            <Ionicons name="water-outline" size={16} color={COLORS.orange} />
          </View>
        </View>

        {/* Podium Container */}
        <View style={styles.podiumContainer}>
          {/* Second Place */}
          <View style={styles.podiumColumn}>
            {result.podium[1] && renderPodiumMember(result.podium[1], 1)}
          </View>

          {/* First Place (Center, Larger) */}
          <View style={styles.podiumColumnCenter}>
            {result.podium[0] && renderPodiumMember(result.podium[0], 0)}
          </View>

          {/* Third Place */}
          <View style={styles.podiumColumn}>
            {result.podium[2] && renderPodiumMember(result.podium[2], 2)}
          </View>
        </View>

        {/* Details Footer */}
        <View style={styles.resultFooter}>
          <TouchableOpacity
            style={styles.detailsButton}
            activeOpacity={0.88}
            onPress={() => router.push(`/resultDetails?resultId=${result.id}`)}
          >
            <Text style={styles.detailsButtonText}>Ver Detalles</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Header — same dark pill style as events */}
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

      <OfflineBanner />

      <ScrollView
        stickyHeaderIndices={[2]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Card — same white card as events */}
        <Animated.View
          style={[
            styles.heroCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.heroPill}>
            <Ionicons name="trophy-outline" size={13} color={COLORS.orangeDeep} />
            <Text style={styles.heroPillText}>PODIOS Y MARCAS</Text>
          </View>

          <Text style={styles.title}>
            RESULTADOS <Text style={styles.titleOrange}>OFICIALES</Text>
          </Text>

          <Text style={styles.subtitle}>
            Consulta los resultados de todas las competencias
          </Text>

          <View style={styles.decorativeLine} />
        </Animated.View>

        {/* Summary Row — same style as events summaryRow */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.pruebas}</Text>
            <Text style={styles.summaryLabel}>Pruebas</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.records}</Text>
            <Text style={styles.summaryLabel}>Récords</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.participantes}</Text>
            <Text style={styles.summaryLabel}>Participantes</Text>
          </View>
        </View>

        {/* Filters container — sticky, same pattern as events */}
        <View style={styles.filtersWrapper}>
          <FilterChips
            variant="scroll"
            options={competitions.map((competition) => ({
              value: competition.id,
              label: competition.name.split(' ').slice(0, 2).join(' '),
              subtitle: competition.date,
            }))}
            value={selectedCompetition}
            onChange={handleCompetitionChange}
            containerStyle={styles.filtersChips}
          />

          {selectedCompetition ? (
            <TouchableOpacity
              style={styles.eventLinkButton}
              activeOpacity={0.85}
              onPress={() =>
                router.push({ pathname: '/eventDetails', params: { eventId: selectedCompetition } })
              }
            >
              <Ionicons name="trophy-outline" size={14} color={COLORS.orange} />
              <Text style={styles.eventLinkText}>Ver evento de esta competición</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.orange} />
            </TouchableOpacity>
          ) : null}

          <FilterChips
            options={filterOptionsFromLabels(RESULT_FILTERS)}
            value={RESULT_FILTERS[activeFilter]}
            onChange={(nextValue) => {
              const index = RESULT_FILTERS.indexOf(nextValue as (typeof RESULT_FILTERS)[number]);
              if (index >= 0) {
                handleFilterChange(index);
              }
            }}
            containerStyle={styles.filtersChipsSecondary}
          />
        </View>

        {/* Results List */}
        <View style={styles.listContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.orange} />
              <Text style={styles.loadingText}>Cargando resultados...</Text>
            </View>
          )}

          {!loading && error !== '' && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="cloud-offline-outline" size={34} color={COLORS.slateLight} />
              </View>
              <Text style={styles.emptyTitle}>No se pudieron cargar los resultados</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadResults(selectedCompetition || undefined, activeFilter)}
                activeOpacity={0.88}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading &&
            error === '' &&
            filteredResults.map((result, index) => renderResultCard(result, index))}

          {!loading && error === '' && filteredResults.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="trophy-outline" size={34} color={COLORS.slateLight} />
              </View>
              <Text style={styles.emptyTitle}>Sin resultados en esta competencia</Text>
              <Text style={styles.emptyText}>
                Selecciona otra competencia o filtro para ver los resultados disponibles.
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

  // ── Header ──────────────────────────────────────────────────────
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

  // ── Hero Card ────────────────────────────────────────────────────
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

  // ── Summary Row ──────────────────────────────────────────────────
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

  // ── Filters (sticky) ─────────────────────────────────────────────
  filtersWrapper: {
    backgroundColor: COLORS.surface,
    paddingBottom: Spacing.three,
    paddingTop: Spacing.two,
    zIndex: 10,
  },

  eventLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.four,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#FFE2B8',
  },

  eventLinkText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },

  filtersChips: {
    marginBottom: 12,
  },

  filtersChipsSecondary: {
    marginTop: 4,
  },

  // ── List ─────────────────────────────────────────────────────────
  listContainer: {
    paddingHorizontal: Spacing.four,
    gap: 20,
    paddingTop: 4,
  },

  // ── Result Card ──────────────────────────────────────────────────
  resultCard: {
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

  // Event Header
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },

  eventName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
    fontStyle: 'italic',
  },

  eventCategory: {
    color: COLORS.slate,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.3,
  },

  eventBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF5E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE2B8',
  },

  // Podium
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    gap: 10,
    backgroundColor: COLORS.white,
  },

  podiumColumn: {
    flex: 1,
    alignItems: 'center',
  },

  podiumColumnCenter: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 20,
  },

  podiumMember: {
    alignItems: 'center',
    width: '100%',
  },

  podiumMemberFirst: {
    transform: [{ scale: 1.08 }],
  },

  medalContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },

  positionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  positionText: {
    color: COLORS.navyDeep,
    fontSize: 11,
    fontWeight: '900',
  },

  podiumImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: COLORS.orange,
    marginBottom: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },

  podiumAthleteName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  podiumClub: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },

  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FFF5E8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE2B8',
  },

  timeText: {
    color: COLORS.orangeDeep,
    fontSize: 12,
    fontWeight: '800',
  },

  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },

  recordText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },

  // Result Footer
  resultFooter: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },

  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.orange,
    borderRadius: 18,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },

  detailsButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Empty state
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
    backgroundColor: COLORS.white,
    borderRadius: 26,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    letterSpacing: 0.4,
  },
});