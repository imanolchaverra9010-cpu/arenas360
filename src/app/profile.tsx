import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
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
import { useSeguimiento } from '@/hooks/use-seguimiento';
import { apiGet, getApiErrorMessage } from '@/services/api';

const { width } = Dimensions.get('window');

// ─── Design tokens (same palette as events.tsx) ───────────────────────────────
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

type AthleteProfile = {
  id: string;
  name: string;
  specialty: string;
  category: string;
  club: string;
  image: string;
  nationality: string;
  birthDate: string;
  medals: { gold: number; silver: number; bronze: number };
  records: number;
  stats: {
    participations: number;
    podiums: number;
    winRate: string;
    avgTime: string;
    bestRank: number;
    seasons: number;
  };
  bestTimes: { event: string; time: string; date: string; competition: string }[];
  recentResults: { id: string; event: string; position: string; time: string; date: string; competition: string }[];
  competitions: {
    id: string;
    name: string;
    location: string;
    date: string;
    status: string;
    statusColor: string;
    position: string;
    events: number;
  }[];
};

type TabKey = 'marcas' | 'estadisticas' | 'competiciones';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'marcas', label: 'Marcas', icon: 'timer-outline' },
  { key: 'estadisticas', label: 'Estadísticas', icon: 'bar-chart-outline' },
  { key: 'competiciones', label: 'Competiciones', icon: 'trophy-outline' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const athleteId = (params.athleteId as string) || '1';
  const { following, loading: followLoading, toggle: toggleFollow } = useSeguimiento('ATLETA', athleteId);
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<TabKey>('marcas');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const loadAthlete = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiGet<AthleteProfile>(`/api/atletas/${athleteId}`);
        setAthlete(data);
      } catch (err) {
        const message = getApiErrorMessage(err, 'No se pudo cargar el atleta');
        setError(message);
        setAthlete(null);
      } finally {
        setLoading(false);
      }
    };

    loadAthlete();
  }, [athleteId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.four }}>
          <Text style={{ color: COLORS.slate, fontWeight: '700' }}>Cargando atleta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !athlete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.four }}>
          <Text style={{ color: COLORS.text, fontWeight: '900', marginBottom: 8 }}>No se pudo cargar el atleta</Text>
          <Text style={{ color: COLORS.slate, textAlign: 'center', marginBottom: 16 }}>{error || 'Atleta no encontrado'}</Text>
          <TouchableOpacity style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14, backgroundColor: COLORS.orange }} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={{ color: COLORS.white, fontWeight: '900' }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const flag = athlete.nationality === 'COLOMBIA' ? '🇨🇴' : athlete.nationality === 'PERÚ' ? '🇵🇪' : '🏳️';

  // ── Medal chip ──────────────────────────────────────────────────────────────
  const renderMedal = (type: 'gold' | 'silver' | 'bronze', count: number) => {
    const color = { gold: COLORS.gold, silver: COLORS.silver, bronze: COLORS.bronze }[type];
    const label = { gold: 'ORO', silver: 'PLATA', bronze: 'BRONCE' }[type];
    return (
      <View style={styles.medalItem}>
        <View style={[styles.medalCircle, { backgroundColor: `${color}18` }]}>
          <Ionicons name="medal" size={22} color={color} />
        </View>
        <Text style={[styles.medalCount, { color: COLORS.text }]}>{count}</Text>
        <Text style={styles.medalLabel}>{label}</Text>
      </View>
    );
  };

  // ── Tab: Mejores Marcas ─────────────────────────────────────────────────────
  const renderMarcas = () => (
    <View style={styles.tabContent}>
      {athlete.bestTimes.map((t, i) => (
        <View key={i} style={styles.timeCard}>
          <View style={styles.timeLeft}>
            <Text style={styles.timeEvent}>{t.event}</Text>
            <Text style={styles.timeMeta}>
              {t.competition} · {t.date}
            </Text>
          </View>
          <Text style={styles.timeValue}>{t.time}</Text>
        </View>
      ))}

      <Text style={styles.subSectionTitle}>RESULTADOS RECIENTES</Text>
      {athlete.recentResults.map((r) => (
        <TouchableOpacity key={r.id} style={styles.resultItem} activeOpacity={0.75}>
          <View style={styles.resultLeft}>
            <View
              style={[
                styles.posBadge,
                r.position === '1°' && { backgroundColor: COLORS.orange },
                r.position === '2°' && { backgroundColor: COLORS.silver },
                r.position === '3°' && { backgroundColor: COLORS.bronze },
              ]}
            >
              <Text style={styles.posText}>{r.position}</Text>
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultEvent}>{r.event}</Text>
              <Text style={styles.resultMeta}>{r.competition}</Text>
            </View>
          </View>
          <View style={styles.resultRight}>
            <Text style={styles.resultTime}>{r.time}</Text>
            <Text style={styles.resultDate}>{r.date}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Tab: Estadísticas ───────────────────────────────────────────────────────
  const renderEstadisticas = () => {
    const s = athlete.stats;
    const statItems = [
      { label: 'Participaciones', value: String(s.participations), icon: 'calendar-outline', color: COLORS.blue },
      { label: 'Podios', value: String(s.podiums), icon: 'medal-outline', color: COLORS.orange },
      { label: 'Tasa de Podio', value: s.winRate, icon: 'trending-up-outline', color: COLORS.green },
      { label: 'Mejor Ranking', value: `#${s.bestRank}`, icon: 'star-outline', color: COLORS.gold },
      { label: 'Tiempo Prom.', value: s.avgTime, icon: 'stopwatch-outline', color: COLORS.orangeDeep },
      { label: 'Temporadas', value: String(s.seasons), icon: 'layers-outline', color: COLORS.slate },
    ];

    return (
      <View style={styles.tabContent}>
        {/* Summary pill */}
        <View style={styles.statSummaryCard}>
          <View style={styles.heroPill}>
            <Ionicons name="flash-outline" size={14} color={COLORS.orange} />
            <Text style={styles.heroPillText}>RENDIMIENTO GLOBAL</Text>
          </View>
          <View style={styles.statSummaryRow}>
            <View style={styles.statSummaryItem}>
              <Text style={styles.statSummaryValue}>{s.participations}</Text>
              <Text style={styles.statSummaryLabel}>Carreras</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statSummaryItem}>
              <Text style={styles.statSummaryValue}>{s.podiums}</Text>
              <Text style={styles.statSummaryLabel}>Podios</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statSummaryItem}>
              <Text style={[styles.statSummaryValue, { color: COLORS.orange }]}>{s.winRate}</Text>
              <Text style={styles.statSummaryLabel}>Podio %</Text>
            </View>
          </View>
          <View style={styles.decorativeLine} />
        </View>

        {/* Grid */}
        <View style={styles.statGrid}>
          {statItems.map((item, i) => (
            <View key={i} style={styles.statGridCard}>
              <View style={[styles.statIconWrap, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.statGridValue}>{item.value}</Text>
              <Text style={styles.statGridLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Records badge */}
        <View style={styles.recordCard}>
          <View style={styles.recordLeft}>
            <Ionicons name="ribbon-outline" size={22} color={COLORS.orange} />
            <View>
              <Text style={styles.recordTitle}>Récords Personales</Text>
              <Text style={styles.recordSub}>Marcas activas registradas</Text>
            </View>
          </View>
          <View style={styles.recordBadge}>
            <Text style={styles.recordBadgeText}>{athlete.records}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ── Tab: Competiciones ──────────────────────────────────────────────────────
  const renderCompeticiones = () => (
    <View style={styles.tabContent}>
      {athlete.competitions.map((comp) => (
        <TouchableOpacity
          key={comp.id}
          style={styles.compCard}
          activeOpacity={0.78}
          onPress={() => router.push({ pathname: '/eventDetails', params: { eventId: comp.id } })}
        >
          {/* Top row */}
          <View style={styles.compTop}>
            <View style={[styles.statusChip, { backgroundColor: `${comp.statusColor}18`, borderColor: `${comp.statusColor}40` }]}>
              <Ionicons
                name={comp.status === 'PRÓXIMO' ? 'play-circle-outline' : 'checkmark-circle-outline'}
                size={13}
                color={comp.statusColor}
              />
              <Text style={[styles.statusChipText, { color: comp.statusColor }]}>{comp.status}</Text>
            </View>
            {comp.position !== '—' && (
              <View style={styles.positionPill}>
                <Text style={styles.positionPillText}>{comp.position}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.compName}>{comp.name}</Text>

          {/* Meta */}
          <View style={styles.compMeta}>
            <View style={styles.metaRow}>
              <View style={styles.metaIconWrap}>
                <Ionicons name="location-outline" size={13} color={COLORS.orange} />
              </View>
              <Text style={styles.compMetaText}>{comp.location}</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaIconWrap}>
                <Ionicons name="calendar-outline" size={13} color={COLORS.slateLight} />
              </View>
              <Text style={styles.compMetaText}>{comp.date}</Text>
            </View>
          </View>

          {/* Stats chips */}
          <View style={styles.compChipsRow}>
            <View style={styles.statChip}>
              <Ionicons name="trophy-outline" size={13} color={COLORS.orange} />
              <Text style={styles.statChipText}>{comp.events} pruebas</Text>
            </View>
            {comp.position !== '—' && (
              <View style={[styles.statChip, styles.statChipGreen]}>
                <Ionicons name="podium-outline" size={13} color={COLORS.green} />
                <Text style={[styles.statChipText, { color: '#059669' }]}>Posición {comp.position}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* ── Navy header (same as events) ── */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>PERFIL ATLETA</Text>
        <View style={styles.headerIconSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Hero card (same structure as events heroCard) ── */}
        <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}>
          <View style={styles.heroPill}>
            <Ionicons name="flash-outline" size={14} color={COLORS.orange} />
            <Text style={styles.heroPillText}>{athlete.category.toUpperCase()} · {flag} {athlete.nationality}</Text>
          </View>

          {/* Profile image */}
          <View style={styles.imageRow}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: athlete.image }} style={styles.profileImage} />
              <View style={styles.nationalityBadge}>
                <Text style={styles.flagEmoji}>{flag}</Text>
              </View>
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.athleteName}>{athlete.name}</Text>
              <View style={styles.infoItem}>
                <Ionicons name="water-outline" size={14} color={COLORS.orange} />
                <Text style={styles.infoText}>{athlete.specialty}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="business-outline" size={14} color={COLORS.slateLight} />
                <Text style={styles.infoText}>{athlete.club}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.slateLight} />
                <Text style={styles.infoText}>{athlete.birthDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.decorativeLine} />
        </Animated.View>

        {/* ── Medals summary row (same style as summaryRow) ── */}
        <View style={styles.summaryRow}>
          {(['gold', 'silver', 'bronze'] as const).map((type) => {
            const color = { gold: COLORS.gold, silver: COLORS.silver, bronze: COLORS.bronze }[type];
            const label = { gold: 'Oro', silver: 'Plata', bronze: 'Bronce' }[type];
            return (
              <View key={type} style={styles.summaryCard}>
                <Ionicons name="medal" size={18} color={color} />
                <Text style={styles.summaryValue}>{athlete.medals[type]}</Text>
                <Text style={styles.summaryLabel}>{label}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Tabs (same filter chip style) ── */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={isActive ? COLORS.white : COLORS.textSoft}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tab Content ── */}
        {activeTab === 'marcas' && renderMarcas()}
        {activeTab === 'estadisticas' && renderEstadisticas()}
        {activeTab === 'competiciones' && renderCompeticiones()}

        {/* ── Action Buttons ── */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.compareButton}
            activeOpacity={0.88}
            onPress={() =>
              router.push({ pathname: '/compareAthletes', params: { athleteId: athlete.id } })
            }
          >
            <Ionicons name="git-compare-outline" size={18} color={COLORS.white} />
            <Text style={styles.compareButtonText}>COMPARAR ATLETA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.followButton, following && styles.followButtonActive]}
            activeOpacity={0.88}
            onPress={() => void toggleFollow()}
            disabled={followLoading}
          >
            <Ionicons
              name={following ? 'star' : 'star-outline'}
              size={18}
              color={following ? COLORS.white : COLORS.orange}
            />
            <Text style={[styles.followButtonText, following && styles.followButtonTextActive]}>
              {followLoading ? '...' : following ? 'SIGUIENDO' : 'SEGUIR ATLETA'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  // ── Header (navy, same as events) ──────────────────────────────────────────
  navHeader: {
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

  navTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
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

  headerIconSpacer: {
    width: 44,
    height: 44,
  },

  // ── Hero card (same as events heroCard) ────────────────────────────────────
  heroCard: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
    paddingVertical: 22,
    paddingHorizontal: 20,
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
    marginBottom: 16,
  },

  heroPillText: {
    color: COLORS.orangeDeep,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 4,
  },

  imageContainer: {
    position: 'relative',
  },

  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.orange,
  },

  nationalityBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: COLORS.white,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  flagEmoji: {
    fontSize: 15,
  },

  heroInfo: {
    flex: 1,
    gap: 6,
  },

  athleteName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    lineHeight: 24,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  infoText: {
    color: COLORS.textSoft,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  decorativeLine: {
    height: 5,
    width: 64,
    backgroundColor: COLORS.orange,
    borderRadius: 999,
    marginTop: 16,
  },

  // ── Summary row (same as events summaryRow) ─────────────────────────────────
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
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.045,
    shadowRadius: 14,
    elevation: 2,
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: -0.4,
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Tabs (filter chip style) ────────────────────────────────────────────────
  tabsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },

  tabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  tabChipActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
    shadowColor: COLORS.orangeDeep,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },

  tabText: {
    color: COLORS.textSoft,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  tabTextActive: {
    color: COLORS.white,
  },

  // ── Tab content wrapper ─────────────────────────────────────────────────────
  tabContent: {
    paddingHorizontal: Spacing.four,
    gap: 12,
  },

  subSectionTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginTop: 8,
    marginBottom: 2,
  },

  // ── Time cards ──────────────────────────────────────────────────────────────
  timeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: Spacing.three,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  timeLeft: {
    gap: 4,
    flex: 1,
  },

  timeEvent: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },

  timeMeta: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: '500',
  },

  timeValue: {
    color: COLORS.orange,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  // ── Result items ────────────────────────────────────────────────────────────
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: Spacing.three,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  posBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.slate,
    justifyContent: 'center',
    alignItems: 'center',
  },

  posText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },

  resultInfo: {
    flex: 1,
    gap: 2,
  },

  resultEvent: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },

  resultMeta: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: '500',
  },

  resultRight: {
    alignItems: 'flex-end',
    gap: 2,
  },

  resultTime: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '800',
  },

  resultDate: {
    color: COLORS.slateLight,
    fontSize: 10,
    fontWeight: '500',
  },

  // ── Stats tab ───────────────────────────────────────────────────────────────
  statSummaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },

  statSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  statSummaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },

  statSummaryValue: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: -0.5,
  },

  statSummaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  statGridCard: {
    width: (width - Spacing.four * 2 - 12) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statGridValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.4,
  },

  statGridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  recordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#FFE2B8',
  },

  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  recordTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },

  recordSub: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  recordBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },

  recordBadgeText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },

  // ── Competition cards ────────────────────────────────────────────────────────
  compCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },

  compTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusChipText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  positionPill: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },

  positionPillText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },

  compName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.4,
    lineHeight: 22,
  },

  compMeta: {
    gap: 8,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  metaIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  compMetaText: {
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  compChipsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },

  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE2B8',
  },

  statChipGreen: {
    backgroundColor: '#F0FDF9',
    borderColor: '#A7F3D0',
  },

  statChipText: {
    color: COLORS.orangeDeep,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ── Action buttons (same as events actionButton / calendarButton) ───────────
  actionSection: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.five,
    gap: 12,
  },

  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.blue,
    height: 56,
    borderRadius: 18,
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },

  compareButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  followButtonText: {
    color: COLORS.orange,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  followButtonActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  followButtonTextActive: {
    color: COLORS.white,
  },

  // ── Unused (kept for compatibility) ─────────────────────────────────────────
  medalItem: { alignItems: 'center', flex: 1 },
  medalCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  medalCount: { fontSize: 18, fontWeight: '900' },
  medalLabel: { color: COLORS.slate, fontSize: 10, fontWeight: '700', marginTop: 2 },
});