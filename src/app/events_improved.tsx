import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

const FILTERS = ['TODOS', 'EN CURSO', 'PRÓXIMOS', 'FINALIZADOS'];

const EVENTS = [
  {
    id: '1',
    title: 'COPA PACÍFICO DE NATACIÓN',
    date: 'DEL 14 DE JUN AL 17 DE JUN',
    status: 'PRÓXIMO',
    statusColor: '#208AEF',
    image: 'https://images.unsplash.com/photo-1530549387074-d56a99e145e3?q=80&w=1000&auto=format&fit=crop',
    tests: '18 PRUEBAS',
    inscribed: '0 INSCRITOS',
    location: 'Piscina Centro Olímpico'
  },
  {
    id: '2',
    title: 'CAMPEONATO NACIONAL ABIERTO',
    date: 'DEL 20 DE JUL AL 25 DE JUL',
    status: 'FINALIZADO',
    statusColor: '#475569',
    image: 'https://images.unsplash.com/photo-1565193298415-53a1d4367c88?q=80&w=1000&auto=format&fit=crop',
    tests: '24 PRUEBAS',
    inscribed: '150 INSCRITOS',
    location: 'Estadio Nacional'
  }
];

export default function EventsScreen() {
  const [activeFilter, setActiveFilter] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderEventItem = ({ item }: { item: typeof EVENTS[0] }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      activeOpacity={0.85}
    >
      <ImageBackground 
        source={{ uri: item.image }} 
        style={styles.eventImage}
        imageStyle={{ borderRadius: 24 }}
      >
        <View style={styles.overlay}>
          {/* Status Badge */}
          <View style={styles.badgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: item.statusColor }]}>
              <Ionicons 
                name={item.status === 'PRÓXIMO' ? 'play-circle-outline' : 'checkmark-circle-outline'} 
                size={14} 
                color="white" 
              />
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          
          {/* Event Info Container */}
          <View style={styles.eventInfoContainer}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            
            {/* Location */}
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#FF9F1C" />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>

            {/* Date */}
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
              <Text style={styles.eventDate}>{item.date}</Text>
            </View>
            
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Ionicons name="trophy-outline" size={14} color="#FF9F1C" />
                <Text style={styles.statText}>{item.tests}</Text>
              </View>
              <View style={styles.statChip}>
                <Ionicons name="people-outline" size={14} color="#10B981" />
                <Text style={styles.statText}>{item.inscribed}</Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Ver detalles</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={styles.logoImage} 
            />
          </View>
          <View>
            <Text style={styles.logoText}>ARENAS</Text>
            <Text style={styles.logoSubtext}>360</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.headerIconButton}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        stickyHeaderIndices={[2]} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Title Section */}
        <Animated.View 
          style={[
            styles.titleSection,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.title}>
            TODOS LOS <Text style={styles.titleOrange}>EVENTOS</Text>
          </Text>
          <Text style={styles.subtitle}>4 eventos en la plataforma</Text>
          <View style={styles.decorativeLine} />
        </Animated.View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filtersScroll}
            scrollEventThrottle={16}
          >
            {FILTERS.map((filter, index) => (
              <TouchableOpacity 
                key={filter} 
                style={[
                  styles.filterChip, 
                  activeFilter === index && styles.filterChipActive
                ]}
                onPress={() => setActiveFilter(index)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === index && styles.filterTextActive
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Events List */}
        <View style={styles.listContainer}>
          {EVENTS.map((event, index) => (
            <Animated.View 
              key={event.id}
              style={{
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30 + index * 10, 0],
                  })
                }]
              }}
            >
              {renderEventItem({ item: event })}
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001529',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  logoImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  logoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  logoSubtext: {
    color: '#FF9F1C',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Title Section
  titleSection: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    fontStyle: 'italic',
    color: 'white',
    letterSpacing: -0.5,
  },
  titleOrange: {
    color: '#FF9F1C',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  decorativeLine: {
    height: 2,
    backgroundColor: 'rgba(255, 159, 28, 0.3)',
    borderRadius: 1,
    marginTop: 12,
  },

  // Filters
  filtersContainer: {
    marginBottom: Spacing.four,
    backgroundColor: '#001529',
    paddingVertical: Spacing.two,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.four,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#1A3A5A',
  },
  filterChipActive: {
    backgroundColor: '#FF9F1C',
    borderColor: '#FF9F1C',
    shadowColor: '#FF9F1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filterTextActive: {
    color: '#001529',
  },

  // List Container
  listContainer: {
    paddingHorizontal: Spacing.four,
    gap: 20,
    paddingBottom: 100,
  },

  // Event Card
  eventCard: {
    height: 380,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#FF9F1C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  eventImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 21, 41, 0.5)',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
  },

  // Badge Container
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
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Event Info Container
  eventInfoContainer: {
    gap: 10,
  },
  eventTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    lineHeight: 32,
    letterSpacing: -0.3,
  },

  // Location Row
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    color: '#FF9F1C',
    fontSize: 13,
    fontWeight: '600',
  },

  // Date Row
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDate: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 29, 61, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#1A3A5A',
  },
  statText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },

  // Action Button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 159, 28, 0.2)',
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF9F1C',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
