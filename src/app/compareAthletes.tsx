import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StatusBar,
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
  navy: '#061629',
  slate: '#64748B',
  slateLight: '#94A3B8',
  text: '#0F172A',
  textSoft: '#334155',
  white: '#FFFFFF',
  orange: '#FF9F1C',
  green: '#10B981',
  blue: '#208AEF',
  border: '#E2E8F0',
  surface: '#F4F7FB',
  shadow: '#0F172A',
};

type AthleteListItem = {
  id: string;
  name: string;
  specialty: string;
  club: string;
  image: string;
  category: string;
};

type CompareRow = {
  label: string;
  valueA: string;
  valueB: string;
  leader?: string | null;
};

type CompareMark = {
  event: string;
  timeA: string;
  timeB: string;
};

type CompareData = {
  athleteA: AthleteListItem;
  athleteB: AthleteListItem;
  rows: CompareRow[];
  commonMarks: CompareMark[];
};

export default function CompareAthletesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const athleteAId = (params.athleteId as string) || '';
  const presetBId = (params.compareWith as string) || '';

  const [athleteA, setAthleteA] = useState<AthleteListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<AthleteListItem[]>([]);
  const [comparison, setComparison] = useState<CompareData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [error, setError] = useState('');
  const [pickerVisible, setPickerVisible] = useState(true);

  const loadAthleteA = useCallback(async () => {
    if (!athleteAId) {
      setError('Atleta base no especificado');
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    setError('');

    try {
      const data = await apiGet<{
        id: string;
        name: string;
        specialty: string;
        club: string;
        image: string;
        category: string;
      }>(`/api/atletas/${athleteAId}`);
      setAthleteA({
        id: data.id,
        name: data.name,
        specialty: data.specialty,
        club: data.club,
        image: data.image,
        category: data.category,
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
      setAthleteA(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [athleteAId]);

  const loadCandidates = useCallback(async (query = '') => {
    setLoadingCandidates(true);
    try {
      const paramsObj = new URLSearchParams();
      paramsObj.set('filtro', 'TODOS');
      if (query.trim()) {
        paramsObj.set('q', query.trim());
      }
      const data = await apiGet<{ athletes: AthleteListItem[] }>(
        `/api/atletas/?${paramsObj.toString()}`
      );
      const items = (data.athletes || []) as AthleteListItem[];
      setCandidates(items.filter((item) => item.id !== athleteAId));
    } catch {
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  }, [athleteAId]);

  const runComparison = useCallback(
    async (athleteBId: string) => {
      setLoadingCompare(true);
      setError('');
      try {
        const data = await apiGet<CompareData>(
          `/api/atletas/comparar?atleta_a=${athleteAId}&atleta_b=${athleteBId}`
        );
        setComparison(data);
        setPickerVisible(false);
      } catch (err) {
        setError(getApiErrorMessage(err, 'No se pudo comparar'));
      } finally {
        setLoadingCompare(false);
      }
    },
    [athleteAId]
  );

  useEffect(() => {
    loadAthleteA();
  }, [loadAthleteA]);

  useEffect(() => {
    if (athleteA) {
      loadCandidates('');
    }
  }, [athleteA, loadCandidates]);

  useEffect(() => {
    if (presetBId && athleteA && presetBId !== athleteAId) {
      runComparison(presetBId);
    }
  }, [presetBId, athleteA, athleteAId, runComparison]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pickerVisible) {
        loadCandidates(searchQuery);
      }
    }, searchQuery ? 350 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery, pickerVisible, loadCandidates]);

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) {
      return candidates;
    }
    const query = searchQuery.toLowerCase();
    return candidates.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.club.toLowerCase().includes(query) ||
        item.specialty.toLowerCase().includes(query)
    );
  }, [candidates, searchQuery]);

  const renderLeaderStyle = (side: 'A' | 'B', leader?: string | null) => {
    if (leader === side) {
      return styles.valueWinner;
    }
    return undefined;
  };

  const renderComparison = () => {
    if (!comparison) return null;

    return (
      <>
        <View style={styles.versusCard}>
          <View style={styles.versusAthlete}>
            <Image source={{ uri: comparison.athleteA.image }} style={styles.versusAvatar} />
            <Text style={styles.versusName} numberOfLines={2}>
              {comparison.athleteA.name}
            </Text>
            <Text style={styles.versusMeta}>{comparison.athleteA.category}</Text>
          </View>

          <View style={styles.versusBadge}>
            <Text style={styles.versusBadgeText}>VS</Text>
          </View>

          <View style={styles.versusAthlete}>
            <Image source={{ uri: comparison.athleteB.image }} style={styles.versusAvatar} />
            <Text style={styles.versusName} numberOfLines={2}>
              {comparison.athleteB.name}
            </Text>
            <Text style={styles.versusMeta}>{comparison.athleteB.category}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>COMPARATIVA DE ESTADÍSTICAS</Text>
          {comparison.rows.map((row) => (
            <View key={row.label} style={styles.compareRow}>
              <Text style={[styles.compareValue, renderLeaderStyle('A', row.leader)]}>
                {row.valueA}
              </Text>
              <View style={styles.compareLabelWrap}>
                <Text style={styles.compareLabel}>{row.label}</Text>
                {row.leader && (
                  <Ionicons
                    name={row.leader === 'A' ? 'arrow-back' : 'arrow-forward'}
                    size={12}
                    color={COLORS.green}
                  />
                )}
              </View>
              <Text style={[styles.compareValue, renderLeaderStyle('B', row.leader)]}>
                {row.valueB}
              </Text>
            </View>
          ))}
        </View>

        {comparison.commonMarks.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>MARCAS EN COMÚN</Text>
            {comparison.commonMarks.map((mark) => (
              <View key={mark.event} style={styles.markRow}>
                <Text style={styles.markEvent}>{mark.event}</Text>
                <View style={styles.markValues}>
                  <Text style={styles.markTime}>{mark.timeA}</Text>
                  <Text style={styles.markDivider}>vs</Text>
                  <Text style={styles.markTime}>{mark.timeB}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.changeButton}
          onPress={() => {
            setPickerVisible(true);
            setComparison(null);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="swap-horizontal-outline" size={18} color={COLORS.blue} />
          <Text style={styles.changeButtonText}>CAMBIAR ATLETA B</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderPicker = () => {
    if (!pickerVisible || comparison) return null;

    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>SELECCIONA ATLETA PARA COMPARAR</Text>
        <Text style={styles.sectionSubtitle}>
          Comparando contra {athleteA?.name || '...'}
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.blue} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar atleta..."
            placeholderTextColor={COLORS.slateLight}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.8}>
              <Ionicons name="close-circle" size={18} color={COLORS.slateLight} />
            </TouchableOpacity>
          )}
        </View>

        {loadingCandidates && (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color={COLORS.blue} />
            <Text style={styles.inlineLoadingText}>Buscando atletas...</Text>
          </View>
        )}

        {!loadingCandidates &&
          filteredCandidates.map((candidate) => (
            <TouchableOpacity
              key={candidate.id}
              style={styles.candidateCard}
              onPress={() => runComparison(candidate.id)}
              activeOpacity={0.85}
              disabled={loadingCompare}
            >
              <Image source={{ uri: candidate.image }} style={styles.candidateAvatar} />
              <View style={styles.candidateInfo}>
                <Text style={styles.candidateName}>{candidate.name}</Text>
                <Text style={styles.candidateMeta}>{candidate.specialty}</Text>
                <Text style={styles.candidateMeta}>{candidate.club}</Text>
              </View>
              <Ionicons name="git-compare-outline" size={20} color={COLORS.blue} />
            </TouchableOpacity>
          ))}

        {!loadingCandidates && filteredCandidates.length === 0 && (
          <Text style={styles.emptyText}>No se encontraron atletas para comparar.</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>COMPARAR ATLETAS</Text>
        <View style={styles.headerButton} />
      </View>

      {loadingProfile && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={styles.centerText}>Cargando atleta base...</Text>
        </View>
      )}

      {!loadingProfile && error !== '' && !comparison && (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAthleteA} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loadingProfile && athleteA && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loadingCompare && (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={COLORS.blue} />
              <Text style={styles.inlineLoadingText}>Generando comparativa...</Text>
            </View>
          )}

          {renderComparison()}
          {renderPicker()}
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
    paddingTop: Platform.OS === 'android' ? 12 : 2,
    paddingBottom: Spacing.three,
    backgroundColor: COLORS.navy,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.8,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: Spacing.four,
    gap: 16,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  centerText: {
    color: COLORS.slate,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '900',
  },
  versusCard: {
    marginHorizontal: Spacing.four,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  versusAthlete: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  versusAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: COLORS.orange,
  },
  versusName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  versusMeta: {
    color: COLORS.slate,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  versusBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  versusBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  sectionCard: {
    marginHorizontal: Spacing.four,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  sectionSubtitle: {
    color: COLORS.slate,
    fontSize: 13,
    fontWeight: '600',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  compareValue: {
    flex: 1,
    color: COLORS.textSoft,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  valueWinner: {
    color: COLORS.green,
  },
  compareLabelWrap: {
    flex: 1.2,
    alignItems: 'center',
    gap: 4,
  },
  compareLabel: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  markRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  markEvent: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  markValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  markTime: {
    flex: 1,
    color: COLORS.blue,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  markDivider: {
    color: COLORS.slateLight,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  candidateAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.blue,
  },
  candidateInfo: {
    flex: 1,
    gap: 2,
  },
  candidateName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
  },
  candidateMeta: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: '600',
  },
  changeButton: {
    marginHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.blue,
    borderRadius: 18,
    paddingVertical: 14,
  },
  changeButtonText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  inlineLoadingText: {
    color: COLORS.slate,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.slate,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
