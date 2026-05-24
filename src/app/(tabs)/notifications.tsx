import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { FilterChips, filterOptionsFromLabels } from '@/components/filter-chips';
import { getApiErrorMessage } from '@/services/api';
import {
  fetchNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  type NotificacionItem,
} from '@/services/notificaciones';
import { navigateFromNotificationPayload } from '@/utils/notification-navigation';

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

const NOTIFICATION_FILTERS = ['TODAS', 'EVENTOS', 'RESULTADOS', 'SISTEMA'] as const;
const FILTER_TYPES = [null, 'event', 'result', 'system'] as const;

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState(0);
  const [notifications, setNotifications] = useState<NotificacionItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filterType = FILTER_TYPES[activeFilter];
      const data = await fetchNotificaciones(filterType ?? undefined);
      setNotifications(data.items);
      setUnreadCount(data.resumen.no_leidas);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar las notificaciones'));
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleOpenNotification = async (notification: NotificacionItem) => {
    if (!notification.read) {
      try {
        await marcarNotificacionLeida(notification.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Navigation still works if mark-read fails.
      }
    }
    navigateFromNotificationPayload(router, notification.payload);
  };

  const handleMarkAllRead = async () => {
    try {
      await marcarTodasLeidas();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore silently; user can retry.
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.headerTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.headerTitle}>NOTIFICACIONES</Text>
            </View>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount} nuevas</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/myAccount')}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={20} color={COLORS.orange} />
          </TouchableOpacity>
        </View>

        <FilterChips
          options={filterOptionsFromLabels(NOTIFICATION_FILTERS)}
          value={NOTIFICATION_FILTERS[activeFilter]}
          onChange={(nextValue) => {
            const index = NOTIFICATION_FILTERS.indexOf(nextValue as (typeof NOTIFICATION_FILTERS)[number]);
            if (index >= 0) {
              setActiveFilter(index);
            }
          }}
          containerStyle={styles.filterContainer}
        />

        {loading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={COLORS.orange} />
            <Text style={styles.stateText}>Cargando notificaciones...</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cloud-offline-outline" size={36} color={COLORS.slateLight} />
            </View>
            <Text style={styles.stateTitle}>Sin conexión</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadNotifications} activeOpacity={0.88}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {unreadCount > 0 && notifications.length > 0 && (
              <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead} activeOpacity={0.8}>
                <Ionicons name="checkmark-done-outline" size={14} color={COLORS.orange} />
                <Text style={styles.markAllText}>Marcar todas como leídas</Text>
              </TouchableOpacity>
            )}

            {notifications.length > 0 ? (
              <View style={styles.notificationsList}>
                {notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    activeOpacity={0.85}
                    style={[
                      styles.notificationCard,
                      !notification.read && styles.notificationCardUnread,
                    ]}
                    onPress={() => handleOpenNotification(notification)}
                  >
                    {!notification.read && <View style={styles.unreadStripe} />}
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: `${notification.color}18`, borderColor: `${notification.color}30` },
                      ]}
                    >
                      <Ionicons
                        name={notification.icon as any}
                        size={22}
                        color={notification.color}
                      />
                    </View>

                    <View style={styles.notificationContent}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.notificationTitle,
                            !notification.read && styles.notificationTitleUnread,
                          ]}
                          numberOfLines={1}
                        >
                          {notification.title}
                        </Text>
                        {!notification.read && <View style={styles.unreadDot} />}
                      </View>

                      <Text style={styles.notificationDescription} numberOfLines={2}>
                        {notification.description}
                      </Text>

                      <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={10} color={COLORS.slateLight} />
                        <Text style={styles.metaText}>{notification.date}</Text>
                        <Text style={styles.metaDivider}>·</Text>
                        <Text style={styles.metaText}>{notification.time}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="notifications-off-outline" size={36} color={COLORS.slateLight} />
                </View>
                <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                <Text style={styles.emptyText}>
                  Sigue eventos, pruebas o atletas para recibir avisos aquí
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 4,
    backgroundColor: COLORS.orange,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.8,
  },
  unreadBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,159,28,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,159,28,0.25)',
  },
  unreadBadgeText: {
    fontSize: 11,
    color: COLORS.orangeDeep,
    fontWeight: '700',
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Filtros
  filterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: Spacing.two,
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

  // Mark all
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,159,28,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,159,28,0.2)',
    marginBottom: Spacing.two,
  },
  markAllText: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '700',
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: 40,
  },
  notificationsList: {
    gap: 10,
  },

  // Notification card
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  notificationCardUnread: {
    borderColor: 'rgba(255,159,28,0.3)',
    shadowOpacity: 0.07,
    elevation: 4,
  },
  unreadStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.orange,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
    borderWidth: 1,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '600',
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '800',
    color: COLORS.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.orange,
    marginLeft: 8,
  },
  notificationDescription: {
    fontSize: 12,
    color: COLORS.slate,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.slateLight,
    fontWeight: '500',
  },
  metaDivider: {
    color: COLORS.slateLight,
    fontSize: 11,
  },

  // Empty
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.slate,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
    lineHeight: 20,
  },
});