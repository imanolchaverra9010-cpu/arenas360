import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { ApiError, getApiErrorMessage } from '@/services/api';
import { apiGetCached, peekCacheForPath } from '@/services/cached-api';

const { width } = Dimensions.get('window');

const COLORS = {
  navy: '#061629',
  navySoft: '#0C223D',
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
  red: '#EF4444',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  border: '#E2E8F0',
  surface: '#F4F7FB',
  surfaceAlt: '#EEF2F7',
  shadow: '#0F172A',
};

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

type ResultDetail = {
  id: string;
  competitionId: string;
  competitionName: string;
  event: string;
  category: string;
  date: string;
  venue: string;
  description: string;
  participants: number;
  records: number;
  podium: PodiumMember[];
  ranking: PodiumMember[];
  bestMark: string;
  wind?: string | null;
  startDate: string;
  endDate: string;
};

function getMedalColor(position: number) {
  switch (position) {
    case 1: return COLORS.gold;
    case 2: return COLORS.silver;
    case 3: return COLORS.bronze;
    default: return COLORS.slateLight;
  }
}

function getMedalIcon(position: number): keyof typeof Ionicons.glyphMap {
  switch (position) {
    case 1: return 'trophy';
    case 2: return 'medal';
    case 3: return 'medal';
    default: return 'ribbon';
  }
}

export default function ResultDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const resultId = (params.resultId as string) || '';
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noResultsYet, setNoResultsYet] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadResult = useCallback(async () => {
    if (!resultId) {
      setError('Resultado no especificado');
      setNoResultsYet(false);
      setLoading(false);
      return;
    }

    setError('');
    setNoResultsYet(false);
    const path = `/api/resultados/detalle/${resultId}`;

    const cached = await peekCacheForPath<ResultDetail>(path);
    if (cached) {
      setResult(cached.data);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const response = await apiGetCached<ResultDetail>(path);
      setResult(response.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNoResultsYet(true);
        setError(
          'Los resultados oficiales de esta competición aún no han sido publicados. Vuelve más tarde.'
        );
        setResult(null);
      } else if (!cached) {
        setError(getApiErrorMessage(err, 'No se pudo cargar el resultado'));
        setResult(null);
      }
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  useEffect(() => { loadResult(); }, [loadResult]);

  useEffect(() => {
    if (!loading && result) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [loading, result, fadeAnim]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={COLORS.orange} />
          <Text style={styles.stateText}>Cargando resultado...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons
              name={noResultsYet ? 'podium-outline' : 'cloud-offline-outline'}
              size={36}
              color={noResultsYet ? COLORS.orange : COLORS.slateLight}
            />
          </View>
          <Text style={styles.stateTitle}>
            {noResultsYet ? 'Aún no hay resultados' : 'No se pudo cargar el resultado'}
          </Text>
          <Text style={styles.stateText}>
            {error || (noResultsYet ? 'Esta competición aún no tiene resultados publicados.' : 'Resultado no encontrado')}
          </Text>
          {!noResultsYet && (
            <TouchableOpacity style={styles.retryButton} onPress={loadResult} activeOpacity={0.88}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.backLinkText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        style={{ opacity: fadeAnim }}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroDimmer}>
            <View style={styles.heroOverlay}>
              <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.heroBadge}>
                <Ionicons name="trophy-outline" size={13} color={COLORS.white} />
                <Text style={styles.heroBadgeText}>RESULTADO</Text>
              </View>
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{result.event}</Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaChip}>
                  <Ionicons name="location-outline" size={13} color={COLORS.orange} />
                  <Text style={styles.heroMetaText}>{result.venue}</Text>
                </View>
                <View style={styles.heroMetaChip}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.white} />
                  <Text style={styles.heroMetaText}>{result.date}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stats flotantes */}
        <View style={styles.quickStats}>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,159,28,0.1)' }]}>
              <Ionicons name="speedometer-outline" size={20} color={COLORS.orange} />
            </View>
            <Text style={styles.statNumber}>{result.bestMark}</Text>
            <Text style={styles.statLabel}>Mejor Marca</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxCenter]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <Ionicons name="people-outline" size={20} color={COLORS.green} />
            </View>
            <Text style={styles.statNumber}>{result.participants}</Text>
            <Text style={styles.statLabel}>Atletas</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <Ionicons name="flash-outline" size={20} color={COLORS.red} />
            </View>
            <Text style={styles.statNumber}>{result.records}</Text>
            <Text style={styles.statLabel}>Récords</Text>
          </View>
        </View>

        {/* Competencia */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>COMPETENCIA</Text>
          </View>
          <TouchableOpacity
            style={styles.competitionCard}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/eventDetails', params: { eventId: result.competitionId } })}
          >
            <View style={styles.competitionCardLeft}>
              <Text style={styles.competitionName}>{result.competitionName}</Text>
              <View style={styles.infoRow}>
                <Ionicons name="layers-outline" size={12} color={COLORS.slateLight} />
                <Text style={styles.infoText}>{result.category}</Text>
              </View>
            </View>
            <View style={styles.competitionLinkIcon}>
              <Ionicons name="open-outline" size={16} color={COLORS.orange} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Podio */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>PODIO</Text>
          </View>
          {result.podium.length > 0 ? (
            result.podium.map((member) => (
              <TouchableOpacity
                key={member.position}
                style={styles.podiumItem}
                activeOpacity={member.deportistaId ? 0.85 : 1}
                disabled={!member.deportistaId}
                onPress={() => {
                  if (!member.deportistaId) return;
                  router.push({ pathname: '/profile', params: { athleteId: member.deportistaId } });
                }}
              >
                <View style={[styles.medalCircle, { backgroundColor: getMedalColor(member.position) }]}>
                  <Ionicons
                    name={getMedalIcon(member.position)}
                    size={18}
                    color={member.position === 1 ? COLORS.navy : COLORS.white}
                  />
                </View>
                <View style={styles.podiumInfo}>
                  <Text style={styles.podiumName}>{member.athlete}</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="home-outline" size={11} color={COLORS.slateLight} />
                    <Text style={styles.infoText}>{member.club}</Text>
                  </View>
                </View>
                <View style={styles.podiumStats}>
                  <Text style={styles.podiumTime}>{member.time}</Text>
                  {member.isRecord && member.recordType && (
                    <View style={styles.recordBadge}>
                      <Ionicons name="flash" size={11} color={COLORS.white} />
                      <Text style={styles.recordText}>{member.recordType}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="trophy-outline" size={28} color={COLORS.slateLight} />
              <Text style={styles.emptySectionText}>No hay podio registrado para esta prueba.</Text>
            </View>
          )}
        </View>

        {/* Clasificación completa */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>CLASIFICACIÓN COMPLETA</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{result.ranking.length}</Text>
            </View>
          </View>
          {result.ranking.map((member, index) => (
            <TouchableOpacity
              key={`${member.position}-${index}`}
              style={styles.rankingItem}
              activeOpacity={member.deportistaId ? 0.85 : 1}
              disabled={!member.deportistaId}
              onPress={() => {
                if (!member.deportistaId) return;
                router.push({ pathname: '/profile', params: { athleteId: member.deportistaId } });
              }}
            >
              <View style={styles.rankingPositionWrap}>
                <Text style={styles.rankingPosition}>{member.position ?? '—'}</Text>
              </View>
              <View style={styles.rankingInfo}>
                <Text style={styles.rankingName}>{member.athlete}</Text>
                <Text style={styles.rankingClub}>{member.club}</Text>
              </View>
              <Text style={styles.rankingTime}>{member.time}</Text>
              {member.isRecord && (
                <View style={styles.recordBadgeSmall}>
                  <Ionicons name="flash" size={10} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Resumen */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>RESUMEN</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={[styles.infoCardIcon, { backgroundColor: '#FFF5E8', borderColor: '#FFE2B8' }]}>
                <Ionicons name="speedometer-outline" size={18} color={COLORS.orange} />
              </View>
              <Text style={styles.infoCardLabel}>Mejor marca</Text>
              <Text style={styles.infoCardValue}>{result.bestMark}</Text>
            </View>
            <View style={styles.infoCard}>
              <View style={[styles.infoCardIcon, { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.22)' }]}>
                <Ionicons name="people-outline" size={18} color={COLORS.green} />
              </View>
              <Text style={styles.infoCardLabel}>Participantes</Text>
              <Text style={styles.infoCardValue}>{result.participants}</Text>
            </View>
            {result.wind && (
              <View style={styles.infoCard}>
                <View style={[styles.infoCardIcon, { backgroundColor: 'rgba(32,138,239,0.08)', borderColor: 'rgba(32,138,239,0.22)' }]}>
                  <Ionicons name="flag-outline" size={18} color={COLORS.blue} />
                </View>
                <Text style={styles.infoCardLabel}>Viento</Text>
                <Text style={styles.infoCardValue}>{result.wind}</Text>
              </View>
            )}
            <View style={styles.infoCard}>
              <View style={[styles.infoCardIcon, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.22)' }]}>
                <Ionicons name="flash-outline" size={18} color={COLORS.red} />
              </View>
              <Text style={styles.infoCardLabel}>Récords</Text>
              <Text style={styles.infoCardValue}>{result.records}</Text>
            </View>
          </View>
        </View>

        {/* Notas */}
        {!!result.description && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>NOTAS DEL RESULTADO</Text>
            </View>
            <View style={styles.descriptionCard}>
              <Text style={styles.description}>{result.description}</Text>
            </View>
          </View>
        )}

        {/* Botones */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/eventDetails', params: { eventId: result.competitionId } })}
          >
            <Ionicons name="trophy-outline" size={18} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>VER EVENTO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={18} color={COLORS.orange} />
            <Text style={styles.secondaryButtonText}>VOLVER</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  // Estados
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: 16,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  retryButton: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 18,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  backLink: { paddingVertical: 8 },
  backLinkText: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: '700',
  },

  // Hero (sin imagen, fondo navy sólido igual al navySoft)
  heroSection: {
    width: '100%',
    height: 280,
    backgroundColor: COLORS.navy,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  heroDimmer: {
    flex: 1,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    backgroundColor: 'rgba(4,16,30,0.75)',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: 44,
  },
  heroOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.orange,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  heroContent: { gap: 10 },
  heroTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    lineHeight: 33,
    letterSpacing: -0.6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroMetaText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },

  // Stats flotantes
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    marginTop: -10,
    marginBottom: Spacing.four,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  statBoxCenter: {
    shadowOpacity: 0.1,
    elevation: 6,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statNumber: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: COLORS.slate,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 4,
    backgroundColor: COLORS.orange,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
    flex: 1,
  },
  countBadge: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  countBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },

  // Competition card
  competitionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  competitionCardLeft: {
    flex: 1,
    gap: 6,
  },
  competitionName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  competitionLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFF5E8',
    borderWidth: 1,
    borderColor: '#FFE2B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  // Podium
  podiumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  medalCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  podiumInfo: {
    flex: 1,
    gap: 4,
  },
  podiumName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  podiumStats: {
    alignItems: 'flex-end',
    gap: 6,
  },
  podiumTime: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: '900',
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.red,
    borderRadius: 10,
  },
  recordText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  recordBadgeSmall: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: COLORS.red,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Ranking
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    gap: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  rankingPositionWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rankingPosition: {
    color: COLORS.orange,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  rankingClub: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  rankingTime: {
    color: COLORS.orange,
    fontSize: 13,
    fontWeight: '800',
  },

  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoCard: {
    width: (width - Spacing.four * 2 - 10) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  infoCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 2,
  },
  infoCardLabel: {
    color: COLORS.slateLight,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  infoCardValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },

  // Description
  descriptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  description: {
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 23,
    fontWeight: '500',
  },

  // Shared row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },

  // Empty states
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptySectionText: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: '500',
  },

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.orange,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 7,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  secondaryButtonText: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});