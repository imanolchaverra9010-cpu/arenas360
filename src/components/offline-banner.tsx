import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useOffline } from '@/contexts/offline-context';

type OfflineBannerProps = {
  /** Brief indicator while a screen refreshes data in the background. */
  refreshing?: boolean;
};

export function OfflineBanner({ refreshing = false }: OfflineBannerProps) {
  const { isOnline, isSyncing } = useOffline();

  if (isOnline && !isSyncing && !refreshing) {
    return null;
  }

  const message = !isOnline
    ? 'Sin conexión · Mostrando datos guardados en el dispositivo'
    : 'Actualizando datos...';

  const icon = !isOnline ? 'cloud-offline-outline' : 'sync-outline';

  return (
    <View style={styles.container}>
      {isOnline ? (
        <ActivityIndicator size="small" color="#FFB84D" style={styles.spinner} />
      ) : (
        <Ionicons name={icon} size={16} color="#FFB84D" />
      )}
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0C223D',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  spinner: {
    width: 16,
    height: 16,
  },
  text: {
    flex: 1,
    color: '#FFD8A3',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 16,
  },
});
