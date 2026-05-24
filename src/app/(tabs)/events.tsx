import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { FilterChips } from '@/components/filter-chips';
import { NotificationBell } from '@/components/notification-bell';
import { OfflineBanner } from '@/components/offline-banner';
import { useCachedQuery } from '@/hooks/use-cached-query';
import { EVENT_FILTERS, matchesEventFilter } from '@/utils/event-filters';

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

const IS_ANDROID = Platform.OS === 'android';

const ANDROID_RIPPLE = {
  card: { color: 'rgba(255, 159, 28, 0.14)', borderless: false },
  primary: { color: 'rgba(255, 255, 255, 0.24)', borderless: false },
  tonal: { color: 'rgba(255, 159, 28, 0.12)', borderless: false },
} as const;

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

export default function EventsScreenV2() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState(0);
  const { data: eventsData, loading, error, refreshing, refetch } = useCachedQuery<EventItem[]>('/api/eventos/');
  const events = eventsData ?? [];
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading && !error) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, error, activeFilter, fadeAnim]);

  const filteredEvents = useMemo(() => {
    const filterValue = EVENT_FILTERS[activeFilter]?.value ?? 'TODOS';
    return events.filter((event) => matchesEventFilter(event.status, filterValue));
  }, [activeFilter, events]);

  const summary = useMemo(
    () => ({
      total: events.length,
      enCurso: events.filter((e) => matchesEventFilter(e.status, 'EN CURSO')).length,
      proximos: events.filter((e) => matchesEventFilter(e.status, 'PRÓXIMO')).length,
      finalizados: events.filter((e) => matchesEventFilter(e.status, 'FINALIZADO')).length,
    }),
    [events]
  );

  const getStatusIcon = (status: string) => {
    const normalized = status.trim().toUpperCase();
    if (normalized === 'EN CURSO') return 'flash-outline';
    if (normalized === 'FINALIZADO' || normalized === 'FINALIZADOS') return 'checkmark-circle-outline';
    return 'play-circle-outline';
  };

  const renderAndroidEventItem = ({ item, index }: { item: EventItem; index: number }) => (
    <Animated.View
      key={item.id}
      style={[
        styles.animatedCard,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [16 + index * 6, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        style={styles.eventCardAndroid}
        android_ripple={ANDROID_RIPPLE.card}
        onPress={() => router.push(`/eventDetails?eventId=${item.id}`)}
      >
        <Image source={{ uri: item.image }} style={styles.eventImageAndroid} resizeMode="cover" />

        <View style={styles.eventContentAndroid}>
          <View style={[styles.statusBadgeAndroid, { backgroundColor: item.statusColor }]}>
            <Ionicons name={getStatusIcon(item.status)} size={13} color={COLORS.white} />
            <Text style={styles.statusTextAndroid}>{item.status}</Text>
          </View>

          <Text style={styles.eventTitleAndroid} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.metaBlockAndroid}>
            <View style={styles.metaRowAndroid}>
              <Ionicons name="location-outline" size={16} color={COLORS.orange} />
              <Text style={styles.metaTextAndroid} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
            <View style={styles.metaRowAndroid}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.slate} />
              <Text style={styles.metaTextAndroid} numberOfLines={1}>
                {item.date}
              </Text>
            </View>
          </View>

          <View style={styles.statsRowAndroid}>
            <View style={styles.statChipAndroid}>
              <Ionicons name="trophy-outline" size={14} color={COLORS.orangeDeep} />
              <Text style={styles.statTextAndroid}>{item.tests}</Text>
            </View>
            <View style={[styles.statChipAndroid, styles.statChipAndroidAlt]}>
              <Ionicons name="people-outline" size={14} color="#059669" />
              <Text style={[styles.statTextAndroid, styles.statTextAndroidAlt]}>{item.inscribed}</Text>
            </View>
          </View>

          <View style={styles.actionButtonsAndroid}>
            <Pressable
              style={styles.actionButtonAndroidFilled}
              android_ripple={ANDROID_RIPPLE.primary}
              onPress={() => router.push(`/eventDetails?eventId=${item.id}`)}
            >
              <Text style={styles.actionButtonAndroidFilledText}>Ver detalles</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </Pressable>

            <Pressable
              style={styles.actionButtonAndroidOutlined}
              android_ripple={ANDROID_RIPPLE.tonal}
              onPress={() => router.push(`/eventSchedule?eventId=${item.id}`)}
            >
              <Ionicons name="calendar-outline" size={16} color={COLORS.orangeDeep} />
              <Text style={styles.actionButtonAndroidOutlinedText}>Calendario</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  const renderEventItem = ({ item, index }: { item: EventItem; index: number }) => {
    if (IS_ANDROID) {
      return renderAndroidEventItem({ item, index });
    }

    return (
    <Animated.View
      key={item.id}
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
        style={styles.eventCard}
        activeOpacity={0.92}
        onPress={() => router.push(`/eventDetails?eventId=${item.id}`)}
      >
        <ImageBackground
          source={{ uri: item.image }}
          style={styles.eventImage}
          imageStyle={styles.eventImageStyle}
        >
          <View style={styles.overlay}>
            <View style={styles.topGlow} />

            <View style={styles.badgeContainer}>
              <View style={[styles.statusBadge, { backgroundColor: item.statusColor }]}>
                <Ionicons name={getStatusIcon(item.status)} size={14} color={COLORS.white} />
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.bottomBlock}>
              <View style={styles.eventInfoContainer}>
                <Text style={styles.eventTitle}>{item.title}</Text>

                <View style={styles.metaBlock}>
                  <View style={styles.metaRow}>
                    <View style={styles.metaIconWrap}>
                      <Ionicons name="location-outline" size={14} color={COLORS.orange} />
                    </View>
                    <Text style={styles.locationText}>{item.location}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaIconWrap}>
                      <Ionicons name="calendar-outline" size={14} color={COLORS.white} />
                    </View>
                    <Text style={styles.eventDate}>{item.date}</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statChip}>
                    <Ionicons name="trophy-outline" size={14} color={COLORS.orange} />
                    <Text style={styles.statText}>{item.tests}</Text>
                  </View>

                  <View style={[styles.statChip, styles.statChipAlt]}>
                    <Ionicons name="people-outline" size={14} color={COLORS.green} />
                    <Text style={styles.statTextAlt}>{item.inscribed}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push(`/eventDetails?eventId=${item.id}`)}
                  activeOpacity={0.88}
                >
                  <Text style={styles.actionButtonText}>Ver detalles</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => router.push(`/eventSchedule?eventId=${item.id}`)}
                  activeOpacity={0.88}
                >
                  <Ionicons name="calendar-outline" size={14} color={COLORS.orangeSoft} />
                  <Text style={styles.calendarButtonText}>Calendario</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.navy}
        translucent={IS_ANDROID ? false : undefined}
      />

      <View style={[styles.header, IS_ANDROID && styles.headerAndroid]}>
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
          <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor="#FF9F1C" colors={['#FF9F1C']} />
        }
      >
        <View style={[styles.heroCard, IS_ANDROID && styles.heroCardAndroid]}>
          {!IS_ANDROID && (
            <View style={styles.heroPill}>
              <Ionicons name="flash-outline" size={14} color={COLORS.orange} />
              <Text style={styles.heroPillText}>COMPETENCIAS Y ACTIVIDAD</Text>
            </View>
          )}

          <Text style={[styles.title, IS_ANDROID && styles.titleAndroid]}>
            TODOS LOS <Text style={styles.titleOrange}>EVENTOS</Text>
          </Text>

          <Text style={[styles.subtitle, IS_ANDROID && styles.subtitleAndroid]}>
            {activeFilter === 0
              ? `${filteredEvents.length} eventos en total`
              : `${filteredEvents.length} de ${events.length} eventos`}
          </Text>

          <View style={[styles.decorativeLine, IS_ANDROID && styles.decorativeLineAndroid]} />
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, IS_ANDROID && styles.summaryCardAndroid]}>
            <Text style={[styles.summaryValue, IS_ANDROID && styles.summaryValueAndroid]}>{summary.total}</Text>
            <Text style={styles.summaryLabel}>Totales</Text>
          </View>

          <View style={[styles.summaryCard, IS_ANDROID && styles.summaryCardAndroid]}>
            <Text style={[styles.summaryValue, IS_ANDROID && styles.summaryValueAndroid]}>{summary.enCurso}</Text>
            <Text style={styles.summaryLabel}>En curso</Text>
          </View>

          <View style={[styles.summaryCard, IS_ANDROID && styles.summaryCardAndroid]}>
            <Text style={[styles.summaryValue, IS_ANDROID && styles.summaryValueAndroid]}>{summary.proximos}</Text>
            <Text style={styles.summaryLabel}>Próximos</Text>
          </View>
        </View>

        <FilterChips
          options={EVENT_FILTERS.map((filter) => ({ value: filter.value, label: filter.label }))}
          value={EVENT_FILTERS[activeFilter]?.value ?? 'TODOS'}
          onChange={(nextValue) => {
            const index = EVENT_FILTERS.findIndex((filter) => filter.value === nextValue);
            if (index >= 0) {
              setActiveFilter(index);
            }
          }}
          containerStyle={[styles.filtersContainer, IS_ANDROID && styles.filtersContainerAndroid]}
        />

        <View style={styles.listContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.orange} />
              <Text style={styles.loadingText}>Cargando eventos...</Text>
            </View>
          )}

          {!loading && error !== '' && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="cloud-offline-outline" size={34} color={COLORS.slateLight} />
              </View>
              <Text style={styles.emptyTitle}>No se pudieron cargar los eventos</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refetch} activeOpacity={0.88}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading &&
            error === '' &&
            filteredEvents.map((event, index) => renderEventItem({ item: event, index }))}

          {!loading && error === '' && filteredEvents.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={34} color={COLORS.slateLight} />
              </View>
              <Text style={styles.emptyTitle}>Sin eventos en esta categoría</Text>
              <Text style={styles.emptyText}>
                Prueba con otro filtro para ver más competiciones disponibles.
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

  filtersContainer: {
    zIndex: 10,
  },

  listContainer: {
    paddingHorizontal: Spacing.four,
    gap: 20,
  },

  animatedCard: {
    marginBottom: 2,
  },

  eventCard: {
    height: 410,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: COLORS.navySoft,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 9,
  },

  eventImage: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.navyDeep,
  },

  eventImageStyle: {
    borderRadius: 30,
  },

  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(4,16,30,0.68)',
  },

  topGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },

  statusText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },

  bottomBlock: {
    gap: 18,
  },

  eventInfoContainer: {
    gap: 14,
  },

  eventTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    lineHeight: 33,
    letterSpacing: -0.6,
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
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
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  locationText: {
    color: '#FFD8A3',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },

  eventDate: {
    color: '#E5EDF7',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    flexWrap: 'wrap',
  },

  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 159, 28, 0.16)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.30)',
  },

  statChipAlt: {
    backgroundColor: 'rgba(16,185,129,0.16)',
    borderColor: 'rgba(16,185,129,0.30)',
  },

  statText: {
    color: '#FFD7A0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  statTextAlt: {
    color: '#B6F3D7',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

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

  calendarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,184,77,0.45)',
  },

  calendarButtonText: {
    color: COLORS.orangeSoft,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

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

  // ─── Android Material 3 ───────────────────────────────────────────────────
  headerAndroid: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 14,
    elevation: 4,
    shadowOpacity: 0,
  },

  heroCardAndroid: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    elevation: 1,
    shadowOpacity: 0,
    borderWidth: 0,
  },

  titleAndroid: {
    fontSize: 28,
    fontStyle: 'normal',
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 34,
  },

  subtitleAndroid: {
    fontWeight: '500',
  },

  decorativeLineAndroid: {
    height: 4,
    width: 56,
    borderRadius: 2,
    marginTop: 14,
  },

  summaryCardAndroid: {
    borderRadius: 12,
    paddingVertical: 14,
    elevation: 1,
    shadowOpacity: 0,
    borderWidth: 0,
    backgroundColor: COLORS.white,
  },

  summaryValueAndroid: {
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'normal',
  },

  filtersContainerAndroid: {
    backgroundColor: COLORS.surface,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  eventCardAndroid: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  eventImageAndroid: {
    width: '100%',
    height: 168,
    backgroundColor: COLORS.surfaceAlt,
  },

  eventContentAndroid: {
    padding: 16,
    gap: 10,
  },

  statusBadgeAndroid: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  statusTextAndroid: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  eventTitleAndroid: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: 0,
  },

  metaBlockAndroid: {
    gap: 6,
  },

  metaRowAndroid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  metaTextAndroid: {
    flex: 1,
    color: COLORS.textSoft,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  statsRowAndroid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },

  statChipAndroid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  statChipAndroidAlt: {
    backgroundColor: '#ECFDF5',
  },

  statTextAndroid: {
    color: COLORS.orangeDeep,
    fontSize: 12,
    fontWeight: '600',
  },

  statTextAndroidAlt: {
    color: '#059669',
  },

  actionButtonsAndroid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },

  actionButtonAndroidFilled: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.orange,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 0,
  },

  actionButtonAndroidFilledText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },

  actionButtonAndroidOutlined: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF4E5',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD8A8',
  },

  actionButtonAndroidOutlinedText: {
    color: COLORS.orangeDeep,
    fontSize: 14,
    fontWeight: '600',
  },
});
