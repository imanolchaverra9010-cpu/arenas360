import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
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

type EventItem = {
  id: string;
  title: string;
  date: string;
  status: string;
  statusColor: string;
  location: string;
};

type CalendarMonth = {
  name: string;
  year: string;
  key: string;
};

type CalendarEvent = {
  id: string;
  day: string;
  month: string;
  title: string;
  location: string;
  type: string;
  color: string;
  monthKey: string;
};

function parseEventDateLabel(dateLabel: string): { day: string; month: string } {
  const label = (dateLabel || '').toUpperCase();
  const dayMatch = label.match(/\b(\d{1,2})\b/);
  const monthMatch = label.match(/\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\b/);
  const day = dayMatch?.[1] ? dayMatch[1].padStart(2, '0') : '—';
  const month = monthMatch?.[1] || '—';
  return { day, month };
}

function monthNameFromShort(short: string): string {
  switch (short) {
    case 'ENE': return 'ENERO';
    case 'FEB': return 'FEBRERO';
    case 'MAR': return 'MARZO';
    case 'ABR': return 'ABRIL';
    case 'MAY': return 'MAYO';
    case 'JUN': return 'JUNIO';
    case 'JUL': return 'JULIO';
    case 'AGO': return 'AGOSTO';
    case 'SEP': return 'SEPTIEMBRE';
    case 'OCT': return 'OCTUBRE';
    case 'NOV': return 'NOVIEMBRE';
    case 'DIC': return 'DICIEMBRE';
    default: return 'MES';
  }
}

export default function CalendarScreen() {
  const router = useRouter();
  const [activeMonthKey, setActiveMonthKey] = useState<string>('');
  const { data: eventsData, loading, error, refreshing, refetch } = useCachedQuery<EventItem[]>('/api/eventos/');

  const { events, months } = useMemo(() => {
    const items = (eventsData || []) as EventItem[];
    const year = String(new Date().getFullYear());
    const calendarEvents: CalendarEvent[] = items.map((item) => {
      const { day, month } = parseEventDateLabel(item.date);
      const monthKey = `${year}-${month}`;
      return {
        id: item.id,
        day,
        month,
        title: (item.title || '').toUpperCase(),
        location: item.location || 'Por confirmar',
        type: (item.status || 'EVENTO').toUpperCase(),
        color: item.statusColor || '#208AEF',
        monthKey,
      };
    });

    const monthKeys = Array.from(new Set(calendarEvents.map((e) => e.monthKey)));
    const monthList: CalendarMonth[] = monthKeys
      .map((key) => {
        const [, monthShort] = key.split('-', 2);
        return {
          key,
          name: monthNameFromShort(monthShort),
          year: key.split('-')[0] || year,
        };
      })
      .sort((a, b) => a.key.localeCompare(b.key));

    return { events: calendarEvents, months: monthList };
  }, [eventsData]);

  useEffect(() => {
    if (months.length && !activeMonthKey) {
      setActiveMonthKey(months[0].key);
    }
  }, [months, activeMonthKey]);

  const visibleEvents = useMemo(() => {
    if (!activeMonthKey) return events;
    return events.filter((e) => e.monthKey === activeMonthKey);
  }, [events, activeMonthKey]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.scrollContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#208AEF" />
          <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '700' }}>Cargando calendario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.scrollContent, { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.four }]}>
          <Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />
          <Text style={{ marginTop: 12, color: '#001529', fontWeight: '900', fontSize: 16, textAlign: 'center' }}>No se pudo cargar el calendario</Text>
          <Text style={{ marginTop: 8, color: '#64748B', fontWeight: '600', textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity style={{ marginTop: 16, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, backgroundColor: '#0F5C9E' }} onPress={refetch} activeOpacity={0.85}>
            <Text style={{ color: 'white', fontWeight: '900' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.bgBlobTop} />
      <View style={styles.bgBlobBottom} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={styles.headerBadge}>
            <Ionicons name="calendar-outline" size={14} color="#0F5C9E" />
            <Text style={styles.headerBadgeText}>Agenda oficial</Text>
          </View>

          <Text style={styles.title}>
            CALENDARIO <Text style={styles.titleAccent}>EVENTOS</Text>
          </Text>
          <Text style={styles.subtitle}>Programación oficial 2026</Text>
        </View>

        <NotificationBell color="#FF9F1C" size={20} style={styles.headerIconButton} />
      </View>

      <OfflineBanner refreshing={refreshing} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="today-outline" size={22} color="#0F5C9E" />
            </View>

            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>Próximos encuentros</Text>
              <Text style={styles.heroDescription}>
                Consulta fechas, sedes y tipos de competición de los eventos
                programados.
              </Text>
            </View>
          </View>

          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricNumber}>{events.length}</Text>
              <Text style={styles.heroMetricLabel}>Eventos</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricNumber}>{months.length}</Text>
              <Text style={styles.heroMetricLabel}>Meses</Text>
            </View>
          </View>
        </View>

        <FilterChips
          variant="scroll"
          activeColor="#0F5C9E"
          options={months.map((month) => ({
            value: month.key,
            label: month.name,
            subtitle: month.year,
          }))}
          value={activeMonthKey}
          onChange={setActiveMonthKey}
          containerStyle={styles.monthSelector}
        />

        {/* Event List */}
        <View style={styles.listContainer}>
          {visibleEvents.length > 0 ? (
            visibleEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                activeOpacity={0.88}
                onPress={() => router.push({ pathname: '/eventDetails', params: { eventId: event.id } })}
              >
                <View style={[styles.cardAccent, { backgroundColor: event.color }]} />

              {/* Date block */}
                <View style={styles.dateBlock}>
                  <Text style={styles.dayText}>{event.day}</Text>
                  <Text style={styles.monthLabel}>{event.month}</Text>
                  <View
                    style={[
                      styles.dateMiniBadge,
                      { backgroundColor: `${event.color}16` },
                    ]}
                  >
                    <View
                      style={[
                        styles.dateMiniDot,
                        { backgroundColor: event.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.dateMiniText,
                        { color: event.color },
                      ]}
                    >
                      Evento
                    </Text>
                  </View>
                </View>

              {/* Content */}
                <View style={styles.eventContent}>
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: `${event.color}16` },
                      ]}
                    >
                      <Text style={[styles.typeText, { color: event.color }]}>
                        {event.type}
                      </Text>
                    </View>

                    <View style={styles.arrowButton}>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#64748B"
                      />
                    </View>
                  </View>

                  <Text style={styles.eventTitle}>{event.title}</Text>

                  <View style={styles.infoRow}>
                    <View style={styles.infoPill}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color="#94A3B8"
                      />
                      <Text style={styles.locationText}>{event.location}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={32} color="#94A3B8" />
              <Text style={{ marginTop: 10, color: '#001529', fontWeight: '900' }}>Sin eventos</Text>
              <Text style={{ marginTop: 6, color: '#64748B', fontWeight: '600', textAlign: 'center', paddingHorizontal: Spacing.four }}>
                No hay eventos para el mes seleccionado.
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Summary */}
        <View style={styles.footerCard}>
          <View style={styles.footerStat}>
            <View style={[styles.footerIconWrap, { backgroundColor: 'rgba(32, 138, 239, 0.10)' }]}>
              <Ionicons name="calendar-outline" size={20} color="#208AEF" />
            </View>
            <Text style={styles.footerNumber}>{events.length}</Text>
            <Text style={styles.footerLabel}>Eventos activos</Text>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerStat}>
            <View style={[styles.footerIconWrap, { backgroundColor: 'rgba(255, 159, 28, 0.12)' }]}>
              <Ionicons name="time-outline" size={20} color="#FF9F1C" />
            </View>
            <Text style={styles.footerNumber}>{String(new Date().getFullYear())}</Text>
            <Text style={styles.footerLabel}>Temporada</Text>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerStat}>
            <View style={[styles.footerIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.10)' }]}>
              <Ionicons name="location-outline" size={20} color="#10B981" />
            </View>
            <Text style={styles.footerNumber}>3</Text>
            <Text style={styles.footerLabel}>Sedes</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    backgroundColor: 'rgba(15, 92, 158, 0.06)',
  },

  bgBlobBottom: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 159, 28, 0.05)',
  },

  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  titleSection: {
    flex: 1,
    paddingRight: 16,
  },

  headerBadge: {
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
    marginBottom: 12,
  },

  headerBadgeText: {
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
  },

  titleAccent: {
    color: '#0F5C9E',
  },

  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },

  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.18)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  heroCard: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAF0F6',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 92, 158, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  heroTextWrap: {
    flex: 1,
  },

  heroTitle: {
    color: '#001529',
    fontSize: 18,
    fontWeight: '900',
  },

  heroDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    fontWeight: '600',
  },

  heroMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
  },

  heroMetric: {
    flex: 1,
    alignItems: 'center',
  },

  heroMetricNumber: {
    color: '#0F5C9E',
    fontSize: 22,
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
    height: 38,
    backgroundColor: '#E2E8F0',
  },

  monthSelector: {
    marginBottom: Spacing.four,
    backgroundColor: 'transparent',
  },

  listContainer: {
    paddingHorizontal: Spacing.four,
    gap: 14,
  },

  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAF0F6',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
    overflow: 'hidden',
  },

  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 4,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },

  dateBlock: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#EEF2F7',
  },

  dayText: {
    color: '#001529',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 30,
  },

  monthLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.6,
  },

  dateMiniBadge: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },

  dateMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
  },

  dateMiniText: {
    fontSize: 10,
    fontWeight: '800',
  },

  eventContent: {
    flex: 1,
    paddingLeft: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  typeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  eventTitle: {
    color: '#001529',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  locationText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },

  footerCard: {
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

  footerStat: {
    alignItems: 'center',
    flex: 1,
  },

  footerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  footerNumber: {
    color: '#0F5C9E',
    fontSize: 20,
    fontWeight: '900',
  },

  footerLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  footerDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#E2E8F0',
  },
});
