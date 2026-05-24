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
import { useSeguimiento } from '@/hooks/use-seguimiento';
import { apiGet, getApiErrorMessage } from '@/services/api';

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

type CompetenciaDetalle = {
  id: string;
  eventoId: string;
  eventoNombre: string;
  prueba: string;
  category: string;
  date: string;
  time: string;
  location: string;
  heats: number;
  phases?: Array<{ id: string; date: string; time: string }>;
  resultId?: string | null;
};

export default function CompetitionDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventoPruebaId = typeof params.eventoPruebaId === 'string' ? params.eventoPruebaId : '';
  const { following, loading: followLoading, toggle: toggleFollow } = useSeguimiento('PRUEBA', eventoPruebaId);

  const [item, setItem] = useState<CompetenciaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    if (!eventoPruebaId) {
      setError('Competencia no especificada');
      setItem(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiGet<CompetenciaDetalle>(`/api/competencias/${eventoPruebaId}`);
      setItem(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cargar la competencia'));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [eventoPruebaId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading && item) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, item, fadeAnim]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <View style={styles.stateIconSurface}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.stateTitle}>Cargando detalle</Text>
          <Text style={styles.stateText}>Estamos preparando la información de la prueba.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <View style={styles.stateIconSurface}>
            <Ionicons name="cloud-offline-outline" size={34} color={COLORS.danger} />
          </View>
          <Text style={styles.stateTitle}>No se pudo cargar el detalle</Text>
          <Text style={styles.stateText}>{error || 'Competencia no encontrada'}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={load} activeOpacity={0.9}>
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
            <Text style={styles.screenEyebrow}>Prueba</Text>
            <Text style={styles.screenTitle}>Detalle</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}> 
          <View style={styles.heroHeader}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="flag-outline" size={26} color={COLORS.primary} />
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{item.prueba}</Text>
              <Text style={styles.heroSubtitle}>{item.category}</Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{item.heats}</Text>
              <Text style={styles.heroStatLabel}>{item.heats === 1 ? 'serie' : 'series'}</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{item.phases?.length ?? 0}</Text>
              <Text style={styles.heroStatLabel}>{(item.phases?.length ?? 0) === 1 ? 'fase' : 'fases'}</Text>
            </View>
          </View>

          <View style={styles.heroInfoList}>
            <View style={styles.heroMetaRow}>
              <Ionicons name="trophy-outline" size={15} color={COLORS.textMuted} />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/eventDetails', params: { eventId: item.eventoId } })}
                style={styles.heroMetaLinkWrap}
              >
                <Text style={[styles.heroMetaText, styles.heroMetaLink]}>{item.eventoNombre}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroMetaRow}>
              <Ionicons name="calendar-outline" size={15} color={COLORS.textMuted} />
              <Text style={styles.heroMetaText}>{item.date}</Text>
            </View>

            <View style={styles.heroMetaRow}>
              <Ionicons name="time-outline" size={15} color={COLORS.textMuted} />
              <Text style={styles.heroMetaText}>{item.time}</Text>
            </View>

            <View style={styles.heroMetaRow}>
              <Ionicons name="location-outline" size={15} color={COLORS.textMuted} />
              <Text style={styles.heroMetaText}>{item.location}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Información de la prueba</Text>
            <Text style={styles.sectionSubtitle}>Resumen general y accesos directos relacionados.</Text>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="person-outline" size={16} color={COLORS.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Categoría</Text>
                <Text style={styles.detailValue}>{item.category}</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="layers-outline" size={16} color={COLORS.warning} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Formato</Text>
                <Text style={styles.detailValue}>
                  {item.heats} {item.heats === 1 ? 'serie programada' : 'series programadas'}
                </Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="calendar-clear-outline" size={16} color={COLORS.success} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Fecha y hora</Text>
                <Text style={styles.detailValue}>{item.date} · {item.time}</Text>
              </View>
            </View>
          </View>
        </View>

        {!!item.phases?.length && (
          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Series programadas</Text>
              <Text style={styles.sectionSubtitle}>Consulta el orden y horario de cada fase registrada.</Text>
            </View>

            <View style={styles.scheduleDay}>
              <View style={styles.dayHeader}>
                <View style={styles.dayHeaderLeft}>
                  <View style={styles.dayIconWrap}>
                    <Ionicons name="layers-outline" size={18} color={COLORS.warning} />
                  </View>

                  <View style={styles.dayTitleWrap}>
                    <Text style={styles.dayTitle}>Fases de competencia</Text>
                    <Text style={styles.daySubtitle}>
                      {item.phases.length} {item.phases.length === 1 ? 'fase disponible' : 'fases disponibles'}
                    </Text>
                  </View>
                </View>

                <View style={styles.eventCountBadge}>
                  <Text style={styles.eventCount}>{item.phases.length}</Text>
                </View>
              </View>

              <View style={styles.eventsList}>
                {item.phases.map((phase, index) => (
                  <View key={phase.id} style={styles.eventItem}>
                    <View style={styles.eventTopRow}>
                      <View style={styles.eventTimeBadge}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.eventTimeText}>{phase.date}</Text>
                      </View>

                      <View style={styles.heatBadge}>
                        <Ionicons name="time-outline" size={12} color={COLORS.warning} />
                        <Text style={styles.heatBadgeText}>{phase.time}</Text>
                      </View>
                    </View>

                    <Text style={styles.eventName}>Fase {index + 1}</Text>

                    <View style={styles.eventMeta}>
                      <View style={styles.metaPill}>
                        <Ionicons name="podium-outline" size={12} color={COLORS.textSecondary} />
                        <Text style={styles.metaText}>Instancia #{index + 1}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Acciones</Text>
            <Text style={styles.sectionSubtitle}>Explora el evento completo, resultados o sigue esta prueba.</Text>
          </View>

          <View style={styles.actionCard}>
            {!!item.resultId && (
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.88}
                onPress={() => router.push({ pathname: '/resultDetails', params: { resultId: item.resultId } })}
              >
                <Ionicons name="podium-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Ver resultados</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.followButton}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/eventDetails', params: { eventId: item.eventoId } })}
              >
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                <Text style={styles.followButtonText}>Ver evento</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.eventAction,
                  following && styles.followButtonActive,
                  followLoading && styles.buttonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => void toggleFollow()}
                disabled={followLoading}
              >
                <Ionicons
                  name={following ? 'checkmark-circle' : 'add-circle-outline'}
                  size={16}
                  color={following ? COLORS.success : COLORS.primary}
                />
                <Text style={[styles.eventActionText, following && styles.followButtonTextActive]}>
                  {followLoading ? 'Actualizando...' : following ? 'Siguiendo' : 'Seguir prueba'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.infoText}>
            Los horarios, fases y sede pueden actualizarse según la programación oficial del evento.
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
  heroMetaLinkWrap: {
    flex: 1,
  },
  heroMetaText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  heroMetaLink: {
    color: COLORS.primary,
    fontWeight: '700',
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
  detailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  scheduleDay: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  dayIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.warningSoft,
    justifyContent: 'center',
    alignItems: 'center',
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
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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
    flex: 1,
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
