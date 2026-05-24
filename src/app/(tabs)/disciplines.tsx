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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { OfflineBanner } from '@/components/offline-banner';
import { apiGetCached, peekCacheForPath } from '@/services/cached-api';
import { getApiErrorMessage } from '@/services/api';
const { width } = Dimensions.get('window');

type DisciplineItem = {
  id: string;
  name: string;
  description: string;
  isOlympic: boolean;
  subdisciplineCount: number;
  athleteCount: number;
  testCount: number;
  subdisciplines: { id: string; name: string }[];
};

type DisciplinesSummary = {
  totalDisciplines: number;
  totalSports: number;
  totalAthletes: number;
  totalTests: number;
};

const getIconName = (name: string) => {
  const key = name.toLowerCase();
  if (key.includes('atletismo')) return 'walk-outline';
  if (key.includes('bádminton') || key.includes('badminton')) return 'tennisball-outline';
  if (key.includes('baloncesto')) return 'basketball-outline';
  if (key.includes('balonmano')) return 'hand-left-outline';
  if (key.includes('boxeo')) return 'fitness-outline';
  if (key.includes('breaking')) return 'musical-notes-outline';
  if (key.includes('canotaje') || key.includes('remo') || key.includes('vela')) return 'boat-outline';
  if (key.includes('ciclismo')) return 'bicycle-outline';
  if (key.includes('ecuestre')) return 'paw-outline';
  if (key.includes('escalada')) return 'trending-up-outline';
  if (key.includes('esgrima')) return 'flash-outline';
  if (key.includes('fútbol') || key.includes('futbol')) return 'football-outline';
  if (key.includes('gimnasia')) return 'body-outline';
  if (key.includes('golf')) return 'golf-outline';
  if (key.includes('halterofilia')) return 'barbell-outline';
  if (key.includes('hockey')) return 'ellipse-outline';
  if (key.includes('judo') || key.includes('lucha') || key.includes('taekwondo')) return 'hand-right-outline';
  if (key.includes('natación') || key.includes('natacion')) return 'water-outline';
  if (key.includes('pentatlón') || key.includes('triatlón') || key.includes('triatlon')) return 'fitness-outline';
  if (key.includes('rugby')) return 'american-football-outline';
  if (key.includes('skate')) return 'skate-outline';
  if (key.includes('surf')) return 'water-outline';
  if (key.includes('tenis de mesa')) return 'tennisball-outline';
  if (key.includes('tenis')) return 'tennisball-outline';
  if (key.includes('tiro con arco')) return 'locate-outline';
  if (key.includes('tiro')) return 'radio-button-on-outline';
  if (key.includes('voleibol')) return 'ellipse-outline';
  return 'medal-outline';
};

export default function DisciplinesScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>([]);
  const [summary, setSummary] = useState<DisciplinesSummary>({
    totalDisciplines: 0,
    totalSports: 0,
    totalAthletes: 0,
    totalTests: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDisciplines = useCallback(async (query = searchText) => {
    setError('');

    const params = new URLSearchParams();
    if (query.trim()) {
      params.set('q', query.trim());
    }
    const path = `/api/disciplinas/?${params.toString()}`;

    const cached = await peekCacheForPath<{
      disciplines: DisciplineItem[];
      summary: DisciplinesSummary;
    }>(path);
    if (cached) {
      setFromCache(true);
      setDisciplines((cached.data.disciplines || []) as DisciplineItem[]);
      setSummary(
        cached.data.summary || {
          totalDisciplines: 0,
          totalSports: 0,
          totalAthletes: 0,
          totalTests: 0,
        }
      );
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const result = await apiGetCached<{
        disciplines: DisciplineItem[];
        summary: DisciplinesSummary;
      }>(path);

      setFromCache(result.fromCache);
      setDisciplines((result.data.disciplines || []) as DisciplineItem[]);
      setSummary(
        result.data.summary || {
          totalDisciplines: 0,
          totalSports: 0,
          totalAthletes: 0,
          totalTests: 0,
        }
      );
    } catch (err) {
      const message = getApiErrorMessage(err, 'No se pudieron cargar las disciplinas');
      setError(message);
      setDisciplines([]);
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }
    searchTimer.current = setTimeout(() => {
      loadDisciplines(searchText);
    }, searchText ? 400 : 0);
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, [searchText, loadDisciplines]);

  useEffect(() => {
    if (!loading && !error) {
      fadeAnim.setValue(0);
      slideAnim.setValue(18);
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
  }, [loading, error, disciplines, fadeAnim, slideAnim]);

  const renderDisciplineItem = (discipline: DisciplineItem, index: number) => {
    const iconName = getIconName(discipline.name);

    return (
      <Animated.View
        key={discipline.id}
        style={[
          styles.disciplineItem,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24 + (index % 3) * 6, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.disciplineCard}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: '/disciplineDetails',
              params: { disciplineId: discipline.id },
            })
          }
        >
          <View style={styles.disciplineGlow} />

          <View style={styles.disciplineIconShell}>
            <View style={styles.disciplineIconContainer}>
              <Ionicons
                name={iconName as any}
                size={34}
                color="#FFFFFF"
              />
              <View style={styles.iconHighlight} />
            </View>
          </View>

          <Text style={styles.disciplineLabelName} numberOfLines={2}>
            {discipline.name}
          </Text>
          <Text style={styles.disciplineDescription} numberOfLines={2}>
            {discipline.description}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.bgBlobTop} />
      <View style={styles.bgBlobBottom} />

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

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.8}>
            <Ionicons name="search-outline" size={20} color="#0F5C9E" />
          </TouchableOpacity>
        </View>
      </View>

      <OfflineBanner />

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero / Title */}
        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="medal-outline" size={16} color="#0F5C9E" />
            <Text style={styles.heroBadgeText}>Catálogo deportivo</Text>
          </View>

          <Text style={styles.title}>
            TODAS LAS <Text style={styles.titleAccent}>DISCIPLINAS</Text>
          </Text>

          <Text style={styles.subtitle}>
            Explora especialidades deportivas y encuentra rápidamente la que te interesa.
          </Text>

          <View style={styles.heroBottomRow}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricNumber}>
                {loading ? '—' : disciplines.length}
              </Text>
              <Text style={styles.heroMetricLabel}>Resultados</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricNumber}>
                {loading ? '—' : summary.totalSports}
              </Text>
              <Text style={styles.heroMetricLabel}>Totales</Text>
            </View>
          </View>
        </Animated.View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <View style={styles.searchIconWrap}>
              <Ionicons name="search-outline" size={18} color="#0F5C9E" />
            </View>

            <TextInput
              style={styles.searchInput}
              onChangeText={setSearchText}
              placeholder="Buscar disciplina..."
              placeholderTextColor="#94A3B8"
              value={searchText}
            />

            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                activeOpacity={0.8}
                style={styles.clearButton}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Grid */}
        <View style={styles.disciplinesContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0F5C9E" />
              <Text style={styles.loadingText}>Cargando disciplinas...</Text>
            </View>
          )}

          {!loading && error !== '' && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="cloud-offline-outline" size={34} color="#0F5C9E" />
              </View>
              <Text style={styles.emptyText}>No se pudieron cargar las disciplinas</Text>
              <Text style={styles.emptySubtext}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadDisciplines(searchText)}
                activeOpacity={0.85}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading &&
            error === '' &&
            disciplines.length > 0 &&
            disciplines.map((discipline, index) =>
              renderDisciplineItem(discipline, index)
            )}

          {!loading && error === '' && disciplines.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="search-outline" size={34} color="#0F5C9E" />
              </View>
              <Text style={styles.emptyText}>No se encontraron disciplinas</Text>
              <Text style={styles.emptySubtext}>
                Prueba con otro término de búsqueda
              </Text>
            </View>
          )}
        </View>

        {/* Stats Footer */}
        {!loading && error === '' && (
          <View style={styles.statsFooter}>
            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(15, 92, 158, 0.10)' }]}>
                <Ionicons name="medal-outline" size={20} color="#0F5C9E" />
              </View>
              <Text style={styles.statNumber}>{summary.totalDisciplines}</Text>
              <Text style={styles.statLabel}>Disciplinas</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.10)' }]}>
                <Ionicons name="trophy-outline" size={20} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{summary.totalSports}</Text>
              <Text style={styles.statLabel}>Deportes</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(255, 159, 28, 0.12)' }]}>
                <Ionicons name="people-outline" size={20} color="#FF9F1C" />
              </View>
              <Text style={styles.statNumber}>{summary.totalAthletes}</Text>
              <Text style={styles.statLabel}>Atletas</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const ITEM_GAP = 12;
const ITEM_WIDTH = (width - Spacing.four * 2 - ITEM_GAP * 2) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBFF',
  },

  bgBlobTop: {
    position: 'absolute',
    top: -70,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(15, 92, 158, 0.07)',
  },

  bgBlobBottom: {
    position: 'absolute',
    bottom: 100,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 159, 28, 0.06)',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    marginTop: Platform.OS === 'android' ? 8 : 0,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 92, 158, 0.18)',
    shadowColor: '#0F5C9E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  logoImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },

  logoText: {
    color: '#001529',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },

  logoSubtext: {
    color: '#0F5C9E',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 1,
  },

  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },

  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15, 92, 158, 0.12)',
    shadowColor: '#0F5C9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  heroCard: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
    padding: 20,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 92, 158, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(15, 92, 158, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },

  heroBadgeText: {
    color: '#0F5C9E',
    fontSize: 12,
    fontWeight: '700',
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#001529',
    letterSpacing: -0.7,
    lineHeight: 34,
  },

  titleAccent: {
    color: '#0F5C9E',
  },

  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
    fontWeight: '600',
  },

  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
  },

  heroMetric: {
    flex: 1,
  },

  heroMetricNumber: {
    color: '#001529',
    fontSize: 20,
    fontWeight: '900',
  },

  heroMetricLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },

  heroDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },

  searchContainer: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.five,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
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
    color: '#001529',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 2,
  },

  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F5C9E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  disciplinesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
  },

  disciplineItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
  },

  disciplineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 155,
    borderWidth: 1,
    borderColor: '#EAF0F6',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },

  disciplineGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(15, 92, 158, 0.05)',
  },

  disciplineIconShell: {
    marginBottom: 12,
  },

  disciplineIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#0F5C9E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F5C9E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
    overflow: 'hidden',
  },

  iconHighlight: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: 34,
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  disciplineLabelName: {
    color: '#0F2942',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 16,
    minHeight: 32,
  },

  disciplineDescription: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 4,
    minHeight: 28,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 48,
    gap: 14,
  },

  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },

  retryButton: {
    marginTop: 10,
    backgroundColor: '#0F5C9E',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAF0F6',
  },

  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 92, 158, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  emptyText: {
    color: '#001529',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },

  emptySubtext: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },

  statsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: Spacing.four,
    marginTop: Spacing.five,
    marginBottom: 40,
    paddingVertical: 18,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EAF0F6',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  statNumber: {
    color: '#0F5C9E',
    fontSize: 20,
    fontWeight: '900',
  },

  statLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#E2E8F0',
  },
});
