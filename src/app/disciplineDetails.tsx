import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { apiGet, getApiErrorMessage } from '@/services/api';

const COLORS = {
  navy: '#001529',
  blue: '#0F5C9E',
  slate: '#64748B',
  border: '#E2E8F0',
  surface: '#F8FBFF',
  white: '#FFFFFF',
  orange: '#FF9F1C',
  green: '#10B981',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

type TabKey = 'athletes' | 'events' | 'results';

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
  club: string;
  bestTime: string;
};

type EventItem = {
  id: string;
  title: string;
  date: string;
  status: string;
  statusColor: string;
  image: string;
  tests: string;
  inscribed: string;
  location: string;
};

type PodiumMember = {
  position: number;
  athlete: string;
  club: string;
  time: string;
};

type ResultItem = {
  id: string;
  competitionId: string;
  event: string;
  category: string;
  podium: PodiumMember[];
};

type DisciplineDetail = {
  id: string;
  name: string;
  description: string;
  isOlympic: boolean;
  subdisciplines: { id: string; name: string }[];
  summary: {
    athleteCount: number;
    eventCount: number;
    resultCount: number;
    testCount: number;
  };
  athletes: AthleteItem[];
  events: EventItem[];
  results: ResultItem[];
};

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'athletes', label: 'Atletas', icon: 'people-outline' },
  { key: 'events', label: 'Eventos', icon: 'calendar-outline' },
  { key: 'results', label: 'Resultados', icon: 'trophy-outline' },
];

function getMedalColor(position: number) {
  if (position === 1) return COLORS.gold;
  if (position === 2) return COLORS.silver;
  if (position === 3) return COLORS.bronze;
  return COLORS.slate;
}

function matchesSearch(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default function DisciplineDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const disciplineId = (params.disciplineId as string) || '';
  const [detail, setDetail] = useState<DisciplineDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('athletes');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const searchPlaceholder =
    activeTab === 'athletes'
      ? 'Buscar atleta...'
      : activeTab === 'events'
        ? 'Buscar evento...'
        : 'Buscar resultado...';

  const filteredAthletes = useMemo(() => {
    if (!detail) return [];
    const query = searchText.trim();
    if (!query) return detail.athletes;
    return detail.athletes.filter(
      (athlete) =>
        matchesSearch(athlete.name, query) ||
        matchesSearch(athlete.specialty, query) ||
        matchesSearch(athlete.club, query) ||
        matchesSearch(athlete.category, query)
    );
  }, [detail, searchText]);

  const filteredEvents = useMemo(() => {
    if (!detail) return [];
    const query = searchText.trim();
    if (!query) return detail.events;
    return detail.events.filter(
      (event) =>
        matchesSearch(event.title, query) ||
        matchesSearch(event.location, query) ||
        matchesSearch(event.date, query) ||
        matchesSearch(event.status, query)
    );
  }, [detail, searchText]);

  const filteredResults = useMemo(() => {
    if (!detail) return [];
    const query = searchText.trim();
    if (!query) return detail.results;
    return detail.results.filter(
      (result) =>
        matchesSearch(result.event, query) ||
        matchesSearch(result.category, query) ||
        result.podium.some(
          (member) =>
            matchesSearch(member.athlete, query) || matchesSearch(member.club, query)
        )
    );
  }, [detail, searchText]);

  const loadDetail = useCallback(async () => {
    if (!disciplineId) {
      setError('Disciplina no especificada');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiGet<DisciplineDetail>(`/api/disciplinas/${disciplineId}`);
      setDetail(data);
    } catch (err) {
      const message = getApiErrorMessage(err, 'No se pudo cargar la disciplina');
      setError(message);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [disciplineId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!loading && detail) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, detail, activeTab, fadeAnim]);

  const renderEmpty = (title: string, subtitle: string) => (
    <View style={styles.emptyBox}>
      <Ionicons name="information-circle-outline" size={32} color={COLORS.blue} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{subtitle}</Text>
    </View>
  );

  const renderSearchEmpty = () =>
    renderEmpty(
      'Sin coincidencias',
      `No encontramos resultados para "${searchText.trim()}".`
    );

  const renderAthletes = () => {
    if (!detail?.athletes.length) {
      return renderEmpty(
        'Sin atletas registrados',
        'Aún no hay deportistas asociados a esta disciplina.'
      );
    }

    if (!filteredAthletes.length) {
      return renderSearchEmpty();
    }

    return filteredAthletes.map((athlete) => (
      <TouchableOpacity
        key={athlete.id}
        style={styles.listCard}
        activeOpacity={0.88}
        onPress={() => router.push({ pathname: '/profile', params: { athleteId: athlete.id } })}
      >
        <Image source={{ uri: athlete.image }} style={styles.avatar} />
        <View style={styles.listContent}>
          <Text style={styles.listTitle}>{athlete.name}</Text>
          <Text style={styles.listSubtitle}>{athlete.specialty}</Text>
          <Text style={styles.listMeta}>{athlete.club}</Text>
        </View>
        <View style={styles.listStats}>
          <Text style={styles.listStatValue}>{athlete.medals}</Text>
          <Text style={styles.listStatLabel}>Medallas</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.slate} />
      </TouchableOpacity>
    ));
  };

  const renderEvents = () => {
    if (!detail?.events.length) {
      return renderEmpty(
        'Sin eventos',
        'No hay eventos registrados con pruebas de esta disciplina.'
      );
    }

    if (!filteredEvents.length) {
      return renderSearchEmpty();
    }

    return filteredEvents.map((event) => (
      <TouchableOpacity
        key={event.id}
        style={styles.eventCard}
        activeOpacity={0.88}
        onPress={() => router.push(`/eventDetails?eventId=${event.id}`)}
      >
        <Image source={{ uri: event.image }} style={styles.eventImage} />
        <View style={styles.eventContent}>
          <View style={[styles.statusPill, { backgroundColor: event.statusColor }]}>
            <Text style={styles.statusPillText}>{event.status}</Text>
          </View>
          <Text style={styles.listTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.listSubtitle}>{event.date}</Text>
          <Text style={styles.listMeta}>{event.location}</Text>
          <View style={styles.eventMetaRow}>
            <Text style={styles.eventMetaText}>{event.tests}</Text>
            <Text style={styles.eventMetaDot}>•</Text>
            <Text style={styles.eventMetaText}>{event.inscribed}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  const renderResults = () => {
    if (!detail?.results.length) {
      return renderEmpty(
        'Sin resultados',
        'Todavía no hay resultados oficiales para esta disciplina.'
      );
    }

    if (!filteredResults.length) {
      return renderSearchEmpty();
    }

    return filteredResults.map((result) => (
      <TouchableOpacity
        key={result.id}
        style={styles.resultCard}
        activeOpacity={0.88}
        onPress={() => router.push(`/resultDetails?resultId=${result.id}`)}
      >
        <View style={styles.resultHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.listTitle}>{result.event}</Text>
            <Text style={styles.listSubtitle}>{result.category}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.slate} />
        </View>

        <View style={styles.podiumRow}>
          {result.podium.slice(0, 3).map((member) => (
            <View key={member.position} style={styles.podiumItem}>
              <View
                style={[
                  styles.podiumBadge,
                  { backgroundColor: getMedalColor(member.position) },
                ]}
              >
                <Text style={styles.podiumBadgeText}>{member.position}</Text>
              </View>
              <Text style={styles.podiumAthlete} numberOfLines={1}>
                {member.athlete}
              </Text>
              <Text style={styles.podiumTime}>{member.time}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disciplina</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={styles.loadingText}>Cargando disciplina...</Text>
        </View>
      )}

      {!loading && error !== '' && (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={36} color={COLORS.slate} />
          <Text style={styles.errorTitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDetail} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && error === '' && detail && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}>
            <View style={styles.heroBadge}>
              <Ionicons name="medal-outline" size={14} color={COLORS.blue} />
              <Text style={styles.heroBadgeText}>
                {detail.isOlympic ? 'Deporte olímpico' : 'Deporte'}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{detail.name}</Text>
            <Text style={styles.heroDescription}>{detail.description}</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryValue}>{detail.summary.athleteCount}</Text>
                <Text style={styles.summaryLabel}>Atletas</Text>
              </View>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryValue}>{detail.summary.eventCount}</Text>
                <Text style={styles.summaryLabel}>Eventos</Text>
              </View>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryValue}>{detail.summary.resultCount}</Text>
                <Text style={styles.summaryLabel}>Resultados</Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.tabsRow}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={isActive ? COLORS.white : COLORS.blue}
                  />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <View style={styles.searchIconWrap}>
                <Ionicons name="search-outline" size={18} color={COLORS.blue} />
              </View>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder={searchPlaceholder}
                placeholderTextColor={COLORS.slate}
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchText('')}
                  activeOpacity={0.8}
                  style={styles.clearButton}
                >
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Animated.View style={{ opacity: fadeAnim }}>
            {activeTab === 'athletes' && renderAthletes()}
            {activeTab === 'events' && renderEvents()}
            {activeTab === 'results' && renderResults()}
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEF4FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '900',
  },
  headerSpacer: {
    width: 42,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: '600',
  },
  errorTitle: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  heroCard: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
    padding: 20,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 92, 158, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: '800',
  },
  heroTitle: {
    color: COLORS.navy,
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  heroDescription: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  summaryChip: {
    flex: 1,
    backgroundColor: '#EEF4FA',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryValue: {
    color: COLORS.blue,
    fontSize: 20,
    fontWeight: '900',
  },
  summaryLabel: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButtonActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  tabText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '800',
  },
  tabTextActive: {
    color: COLORS.white,
  },
  searchContainer: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  searchIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 92, 158, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 2,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: Spacing.four,
    marginBottom: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: COLORS.blue,
  },
  listContent: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '900',
  },
  listSubtitle: {
    color: COLORS.slate,
    fontSize: 12,
    fontWeight: '600',
  },
  listMeta: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: '500',
  },
  listStats: {
    alignItems: 'center',
    marginRight: 4,
  },
  listStatValue: {
    color: COLORS.orange,
    fontSize: 16,
    fontWeight: '900',
  },
  listStatLabel: {
    color: COLORS.slate,
    fontSize: 10,
    fontWeight: '700',
  },
  eventCard: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: Spacing.four,
    marginBottom: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventImage: {
    width: 88,
    height: 88,
    borderRadius: 18,
  },
  eventContent: {
    flex: 1,
    gap: 4,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  eventMetaText: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: '700',
  },
  eventMetaDot: {
    color: COLORS.slate,
  },
  resultCard: {
    marginHorizontal: Spacing.four,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: 8,
  },
  podiumItem: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  podiumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  podiumBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },
  podiumAthlete: {
    color: COLORS.navy,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  podiumTime: {
    color: COLORS.slate,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyBox: {
    marginHorizontal: Spacing.four,
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.slate,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});
