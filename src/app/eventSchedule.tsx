import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { apiGet, getApiErrorMessage } from '@/services/api';
import { getSeguimientosEstados, toggleSeguimiento } from '@/services/seguimientos';

type CronogramaPrueba = {
  time: string;
  event: string;
  category: string;
  pool: string;
  heats: number;
  eventoPruebaId?: string;
};

type CronogramaDia = {
  id: string;
  day: string;
  events: CronogramaPrueba[];
};

type CronogramaResponse = {
  id: string;
  eventName: string;
  startDate: string;
  endDate: string;
  location: string;
  totalPruebas: number;
  totalDays: number;
  schedule: CronogramaDia[];
};

const COLORS = {
  background: '#F4F7FB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  primary: '#2563EB',
  primarySoft: '#DBEAFE',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  shadow: 'rgba(15, 23, 42, 0.08)',
};

export default function EventScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventIdParam = params.eventId;
  const eventId = typeof eventIdParam === 'string' ? eventIdParam : '';

  const [scheduleInfo, setScheduleInfo] = useState<CronogramaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDay, setExpandedDay] = useState('');
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadFollowStates = useCallback(async (schedule: CronogramaDia[]) => {
    const ids = schedule
      .flatMap((day) => day.events.map((event) => event.eventoPruebaId))
      .filter((id): id is string => Boolean(id));

    if (ids.length === 0) {
      setFollowed({});
      return;
    }

    try {
      const estados = await getSeguimientosEstados('PRUEBA', ids);
      setFollowed(estados);
    } catch {
      setFollowed({});
    }
  }, []);

  const handleToggleFollow = async (eventoPruebaId: string) => {
    if (followLoading[eventoPruebaId]) {
      return;
    }

    setFollowLoading((prev) => ({ ...prev, [eventoPruebaId]: true }));
    try {
      const data = await toggleSeguimiento('PRUEBA', eventoPruebaId);
      setFollowed((prev) => ({ ...prev, [eventoPruebaId]: data.following }));
    } finally {
      setFollowLoading((prev) => ({ ...prev, [eventoPruebaId]: false }));
    }
  };

  const loadSchedule = useCallback(async () => {
    if (!eventId) {
      setError('Evento no especificado');
      setScheduleInfo(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await apiGet<CronogramaResponse>(`/api/eventos/${eventId}/cronograma`);
      setScheduleInfo(payload);
      setExpandedDay(payload.schedule.length > 0 ? payload.schedule[0].id : '');
      await loadFollowStates(payload.schedule);
    } catch (err) {
      const message = getApiErrorMessage(err, 'No se pudo cargar el cronograma');
      setError(message);
      setScheduleInfo(null);
    } finally {
      setLoading(false);
    }
  }, [eventId, loadFollowStates]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    if (!loading && scheduleInfo) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, scheduleInfo, fadeAnim]);

  const renderScheduleDay = (day: CronogramaDia) => {
    const isExpanded = expandedDay === day.id;

    return (
      <View key={day.id} style={styles.scheduleDay}>
        <TouchableOpacity
          style={[styles.dayHeader, isExpanded && styles.dayHeaderExpanded]}
          onPress={() => setExpandedDay(isExpanded ? '' : day.id)}
          activeOpacity={0.85}
        >
          <View style={styles.dayHeaderLeft}>
            <View style={[styles.dayIconWrap, isExpanded && styles.dayIconWrapExpanded]}>
              <Ionicons
                name="calendar-clear-outline"
                size={18}
                color={isExpanded ? COLORS.primary : COLORS.warning}
              />
            </View>

            <View style={styles.dayTitleWrap}>
              <Text style={styles.dayTitle}>{day.day}</Text>
              <Text style={styles.daySubtitle}>
                {day.events.length} {day.events.length === 1 ? 'prueba programada' : 'pruebas programadas'}
              </Text>
            </View>
          </View>

          <View style={styles.dayHeaderRight}>
            <View style={styles.eventCountBadge}>
              <Text style={styles.eventCount}>{day.events.length}</Text>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textMuted}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.eventsList}>
            {day.events.map((event, index) => {
              const eventKey = event.eventoPruebaId ?? `${day.id}-${index}`;
              const isFollowed = followed[event.eventoPruebaId ?? ''];
              const isFollowLoading = followLoading[event.eventoPruebaId ?? ''];

              return (
                <View key={eventKey} style={styles.eventItem}>
                  <View style={styles.eventTopRow}>
                    <View style={styles.eventTimeBadge}>
                      <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.eventTimeText}>{event.time}</Text>
                    </View>

                    {event.heats > 0 && (
                      <View style={styles.heatBadge}>
                        <Ionicons name="layers-outline" size={12} color={COLORS.warning} />
                        <Text style={styles.heatBadgeText}>
                          {event.heats} {event.heats === 1 ? 'serie' : 'series'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.eventName}>{event.event}</Text>

                  <View style={styles.eventMeta}>
                    <View style={styles.metaPill}>
                      <Ionicons name="person-outline" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.metaText}>{event.category}</Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Ionicons name="water-outline" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.metaText}>{event.pool}</Text>
                    </View>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.followButton,
                        isFollowed && styles.followButtonActive,
                        (!event.eventoPruebaId || isFollowLoading) && styles.buttonDisabled,
                      ]}
                      activeOpacity={0.85}
                      disabled={!event.eventoPruebaId || isFollowLoading}
                      onPress={() => {
                        if (!event.eventoPruebaId) return;
                        void handleToggleFollow(event.eventoPruebaId);
                      }}
                    >
                      <Ionicons
                        name={isFollowed ? 'checkmark-circle' : 'add-circle-outline'}
                        size={16}
                        color={isFollowed ? COLORS.success : COLORS.primary}
                      />
                      <Text style={[styles.followButtonText, isFollowed && styles.followButtonTextActive]}>
                        {isFollowLoading ? 'Actualizando...' : isFollowed ? 'Siguiendo' : 'Seguir'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.eventAction, !event.eventoPruebaId && styles.buttonDisabled]}
                      activeOpacity={0.85}
                      disabled={!event.eventoPruebaId}
                      onPress={() => {
                        if (!event.eventoPruebaId) return;
                        router.push({
                          pathname: '/competitionDetails',
                          params: { eventoPruebaId: event.eventoPruebaId },
                        });
                      }}
                    >
                      <Text style={styles.eventActionText}>Ver detalle</Text>
                      <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <View style={styles.stateIconSurface}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.stateTitle}>Cargando cronograma</Text>
          <Text style={styles.stateText}>Estamos preparando la programación del evento.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !scheduleInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <View style={styles.stateIconSurface}>
            <Ionicons name="cloud-offline-outline" size={34} color={COLORS.danger} />
          </View>
          <Text style={styles.stateTitle}>No se pudo cargar el calendario</Text>
          <Text style={styles.stateText}>{error || 'Evento no encontrado'}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={loadSchedule} activeOpacity={0.9}>
            <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.backLinkText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={styles.contentContainer}
      >
        <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.screenEyebrow}>Evento</Text>
            <Text style={styles.screenTitle}>Cronograma</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="calendar-outline" size={26} color={COLORS.primary} />
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{scheduleInfo.eventName}</Text>
              <Text style={styles.heroSubtitle}>{scheduleInfo.location}</Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{scheduleInfo.totalDays}</Text>
              <Text style={styles.heroStatLabel}>{scheduleInfo.totalDays === 1 ? 'día' : 'días'}</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{scheduleInfo.totalPruebas}</Text>
              <Text style={styles.heroStatLabel}>pruebas</Text>
            </View>
          </View>

          <View style={styles.heroInfoList}>
            <View style={styles.heroMetaRow}>
              <Ionicons name="location-outline" size={15} color={COLORS.textMuted} />
              <Text style={styles.heroMetaText}>{scheduleInfo.location}</Text>
            </View>
            <View style={styles.heroMetaRow}>
              <Ionicons name="calendar-outline" size={15} color={COLORS.textMuted} />
              <Text style={styles.heroMetaText}>
                {scheduleInfo.startDate}
                {scheduleInfo.endDate !== scheduleInfo.startDate ? ` — ${scheduleInfo.endDate}` : ''}
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Calendario de pruebas</Text>
            <Text style={styles.sectionSubtitle}>Pulsa un día para desplegar su programación.</Text>
          </View>

          {scheduleInfo.schedule.length > 0 ? (
            scheduleInfo.schedule.map((day) => renderScheduleDay(day))
          ) : (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-clear-outline" size={28} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Sin pruebas programadas</Text>
              <Text style={styles.emptyText}>
                Este evento aún no tiene pruebas activas en la base de datos.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.infoText}>
            Los horarios provienen de la programación del evento y pueden actualizarse.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 40,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  stateIconSurface: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
  retryButton: {
    marginTop: 22,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  backLink: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  backLinkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 14,
  },
  headerTitleWrap: {
    flex: 1,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  screenEyebrow: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  screenTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 22,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  heroIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroStatValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  heroStatLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroInfoList: {
    gap: 10,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroMetaText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeading: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  scheduleDay: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  dayHeader: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
  },
  dayHeaderExpanded: {
    backgroundColor: '#FAFCFF',
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.warningSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayIconWrapExpanded: {
    backgroundColor: COLORS.primarySoft,
  },
  dayTitleWrap: {
    flex: 1,
  },
  dayTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  daySubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  eventCountBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCount: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  eventItem: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  eventTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
  },
  eventTimeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  heatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.warningSoft,
  },
  heatBadgeText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  eventName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  followButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  followButtonActive: {
    backgroundColor: COLORS.successSoft,
    borderColor: '#BBF7D0',
  },
  followButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  followButtonTextActive: {
    color: COLORS.success,
  },
  eventAction: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  eventActionText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  emptyBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
});
