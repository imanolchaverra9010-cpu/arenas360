import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useSeguimiento } from '@/hooks/use-seguimiento';
import { OfflineBanner } from '@/components/offline-banner';
import { apiGetCached, peekCacheForPath } from '@/services/cached-api';
import { getApiErrorMessage } from '@/services/api';
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
  border: '#E2E8F0',
  surface: '#F4F7FB',
  surfaceAlt: '#EEF2F7',
  shadow: '#0F172A',
};

type AtletaInscrito = {
  id: string;
  name: string;
  club: string;
  category: string;
  image: string;
  events: number;
  specialty: string;
};

type EventoDetalle = {
  id: string;
  title: string;
  image: string;
  status: string;
  statusColor: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  description: string;
  totalEvents: number;
  totalAthletes: number;
  totalCountries: number;
  organizer: string;
  contact: string;
  email: string;
  website: string;
  registrationDeadline: string;
  registrationFee: string;
  inscribed: number;
  athletes: AtletaInscrito[];
};

export default function EventDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = (params.eventId as string) || '1';
  const { following, loading: followLoading, toggle: toggleFollow } = useSeguimiento('EVENTO', eventId);
  const [event, setEvent] = useState<EventoDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const [showAthletes, setShowAthletes] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const loadEvent = useCallback(async () => {
    setError('');
    const path = `/api/eventos/${eventId}`;

    const cached = await peekCacheForPath<EventoDetalle>(path);
    if (cached) {
      setFromCache(true);
      setEvent(cached.data);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const result = await apiGetCached<EventoDetalle>(path);
      setFromCache(result.fromCache);
      setEvent(result.data);
    } catch (err) {
      const message = getApiErrorMessage(err, 'No se pudo cargar el evento');
      setError(message);
      if (!cached) {
        setEvent(null);
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void loadEvent(); }, [loadEvent]);

  useEffect(() => {
    if (!loading && event) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [loading, event, fadeAnim]);

  const getStatusIcon = (status: string) => {
    if (status === 'EN CURSO') return 'flash-outline';
    if (status === 'FINALIZADO') return 'checkmark-circle-outline';
    return 'play-circle-outline';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={COLORS.orange} />
          <Text style={styles.stateText}>Cargando evento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cloud-offline-outline" size={36} color={COLORS.slateLight} />
          </View>
          <Text style={styles.stateTitle}>No se pudo cargar el evento</Text>
          <Text style={styles.stateText}>{error || 'Evento no encontrado'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadEvent} activeOpacity={0.88}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.backLinkText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderAthleteCard = (athlete: AtletaInscrito) => (
    <TouchableOpacity
      key={athlete.id}
      style={styles.athleteCard}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/profile', params: { athleteId: athlete.id } })}
    >
      <Image source={{ uri: athlete.image }} style={styles.athleteCardImage} />
      <View style={styles.athleteCardOverlay}>
        <View style={styles.categoryBadgeSmall}>
          <Text style={styles.categoryBadgeSmallText}>{athlete.category}</Text>
        </View>
      </View>
      <View style={styles.athleteCardContent}>
        <Text style={styles.athleteCardName} numberOfLines={1}>{athlete.name}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="home-outline" size={11} color={COLORS.slateLight} />
          <Text style={styles.infoText} numberOfLines={1}>{athlete.club}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="water-outline" size={11} color={COLORS.orange} />
          <Text style={styles.infoTextOrange} numberOfLines={1}>{athlete.specialty}</Text>
        </View>
        <View style={styles.eventCountBadge}>
          <Ionicons name="trophy-outline" size={11} color={COLORS.green} />
          <Text style={styles.eventCountText}>{athlete.events} eventos</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        style={{ opacity: fadeAnim }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Hero */}
        <ImageBackground
          source={{ uri: event.image }}
          style={styles.heroSection}
          imageStyle={{ borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}
        >
          <View style={styles.heroDimmer}>
            <View style={styles.heroOverlay}>
              <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color={COLORS.white} />
              </TouchableOpacity>
              <View style={[styles.heroBadge, { backgroundColor: event.statusColor }]}>
                <Ionicons name={getStatusIcon(event.status)} size={13} color={COLORS.white} />
                <Text style={styles.heroBadgeText}>{event.status}</Text>
              </View>
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{event.title}</Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaChip}>
                  <Ionicons name="location-outline" size={13} color={COLORS.orange} />
                  <Text style={styles.heroMetaText}>{event.location}</Text>
                </View>
                <View style={styles.heroMetaChip}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.white} />
                  <Text style={styles.heroMetaText}>{event.startDate}</Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* Stats flotantes */}
        <View style={styles.quickStats}>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,159,28,0.1)' }]}>
              <Ionicons name="water-outline" size={20} color={COLORS.orange} />
            </View>
            <Text style={styles.statNumber}>{event.totalEvents}</Text>
            <Text style={styles.statLabel}>Pruebas</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxCenter]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <Ionicons name="people-outline" size={20} color={COLORS.green} />
            </View>
            <Text style={styles.statNumber}>{event.totalAthletes}</Text>
            <Text style={styles.statLabel}>Atletas</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(32,138,239,0.1)' }]}>
              <Ionicons name="globe-outline" size={20} color={COLORS.blue} />
            </View>
            <Text style={styles.statNumber}>{event.totalCountries}</Text>
            <Text style={styles.statLabel}>Países</Text>
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>ACERCA DEL EVENTO</Text>
          </View>
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        </View>

        {/* Info importante */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>INFORMACIÓN IMPORTANTE</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={[styles.infoCardIcon, { backgroundColor: '#FFF5E8', borderColor: '#FFE2B8' }]}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.orange} />
              </View>
              <Text style={styles.infoCardLabel}>Cierre inscripción</Text>
              <Text style={styles.infoCardValue}>{event.registrationDeadline}</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={[styles.infoCardIcon, { backgroundColor: '#FFF5E8', borderColor: '#FFE2B8' }]}>
                <Ionicons name="person-outline" size={18} color={COLORS.orange} />
              </View>
              <Text style={styles.infoCardLabel}>Organizador</Text>
              <Text style={styles.infoCardValue}>{event.organizer}</Text>
            </View>
          </View>
        </View>

        {/* Atletas */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>ATLETAS INSCRITOS</Text>
            </View>
            <View style={styles.athleteHeaderRight}>
              <View style={styles.athleteCountBadge}>
                <Text style={styles.athleteCountText}>{event.athletes.length}</Text>
              </View>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowAthletes(v => !v)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={showAthletes ? 'eye-off-outline' : 'eye-outline'}
                  size={16}
                  color={COLORS.slate}
                />
              </TouchableOpacity>
            </View>
          </View>

          {showAthletes && (
            event.athletes.length > 0 ? (
              <View style={styles.athletesGrid}>
                {event.athletes.map((athlete) => renderAthleteCard(athlete))}
              </View>
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="people-outline" size={28} color={COLORS.slateLight} />
                <Text style={styles.emptySectionText}>Aún no hay atletas inscritos.</Text>
              </View>
            )
          )}
        </View>

        {/* Botones */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.shareButton}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/eventSchedule', params: { eventId: event.id } })}
          >
            <Ionicons name="calendar-outline" size={18} color={COLORS.orange} />
            <Text style={styles.shareButtonText}>CALENDARIO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.followEventButton, following && styles.followEventButtonActive]}
            activeOpacity={0.85}
            onPress={() => void toggleFollow()}
            disabled={followLoading}
          >
            <Ionicons
              name={following ? 'star' : 'star-outline'}
              size={18}
              color={following ? COLORS.white : COLORS.orange}
            />
            <Text style={[styles.followEventButtonText, following && styles.followEventButtonTextActive]}>
              {followLoading ? '...' : following ? 'SIGUIENDO' : 'SEGUIR EVENTO'}
            </Text>
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

  // Hero
  heroSection: {
    width: '100%',
    height: 350,
  },
  heroDimmer: {
    flex: 1,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    backgroundColor: 'rgba(4,16,30,0.62)',
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
    fontSize: 30,
    fontWeight: '900',
    fontStyle: 'italic',
    lineHeight: 35,
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

  // Stats
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
    fontSize: 22,
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
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
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

  // Info grid 2x2
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

  // Athletes
  athleteHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  athleteCountBadge: {
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
  athleteCountText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  athletesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  athleteCard: {
    width: (width - Spacing.four * 2 - 12) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  athleteCardImage: {
    width: '100%',
    height: 130,
  },
  athleteCardOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  categoryBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,245,232,0.92)',
    borderWidth: 1,
    borderColor: '#FFE2B8',
  },
  categoryBadgeSmallText: {
    color: COLORS.orangeDeep,
    fontSize: 10,
    fontWeight: '800',
  },
  athleteCardContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 5,
  },
  athleteCardName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
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
  infoTextOrange: {
    color: COLORS.orangeDeep,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  eventCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.22)',
    alignSelf: 'flex-start',
  },
  eventCountText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '700',
  },
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

  // Botones
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  inscribeButton: {
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
  inscribeButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  shareButton: {
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
  shareButtonText: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  followEventButton: {
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
  },
  followEventButtonActive: {
    backgroundColor: COLORS.orange,
  },
  followEventButtonText: {
    color: COLORS.orange,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  followEventButtonTextActive: {
    color: COLORS.white,
  },
});