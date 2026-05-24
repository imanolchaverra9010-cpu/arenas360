import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { fetchNotificacionesResumen } from '@/services/notificaciones';

type NotificationBellProps = {
  color?: string;
  size?: number;
  style?: object;
};

export function NotificationBell({ color = '#FFFFFF', size = 22, style }: NotificationBellProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);

  const loadUnread = useCallback(async () => {
    if (!isAuthenticated) {
      setUnread(0);
      return;
    }

    try {
      const data = await fetchNotificacionesResumen();
      setUnread(data.no_leidas);
    } catch {
      setUnread(0);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      void loadUnread();
    }, [loadUnread])
  );

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      activeOpacity={0.8}
      onPress={() => router.push('/notifications')}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
