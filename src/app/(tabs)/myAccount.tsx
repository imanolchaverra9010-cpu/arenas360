import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { getApiErrorMessage } from '@/services/api';
import { enviarPushPrueba } from '@/services/notificaciones';
import { fetchPreferencias, updatePreferencias } from '@/services/preferencias';
import {
  registerPushNotificationsIfEnabled,
  unregisterPushNotifications,
} from '@/services/push-notifications';

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
  red: '#EF4444',
  border: '#E2E8F0',
  surface: '#F4F7FB',
  surfaceAlt: '#EEF2F7',
  shadow: '#0F172A',
};

const { width } = Dimensions.get('window');

const MENU_OPTIONS = [
  { id: '1', label: 'Editar Perfil', icon: 'pencil-outline', color: COLORS.orange },
  { id: '2', label: 'Historial Completo', icon: 'list-outline', color: COLORS.blue },
];

export default function MyAccountScreen() {
  const router = useRouter();
  const { usuario, logout, refreshUsuario } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUsuario = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await refreshUsuario();
      if (!data) {
        throw new Error('Sesión no encontrada. Inicia sesión nuevamente.');
      }

      const prefs = await fetchPreferencias();
      setNotificationsEnabled(prefs.notificaciones_push);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cargar el usuario'));
    } finally {
      setLoading(false);
    }
  }, [refreshUsuario]);

  const handleNotificationsToggle = useCallback(async (enabled: boolean) => {
    setUpdatingNotifications(true);
    try {
      const prefs = await updatePreferencias(enabled);
      setNotificationsEnabled(prefs.notificaciones_push);

      if (prefs.notificaciones_push) {
        const registration = await registerPushNotificationsIfEnabled();
        if (!registration.success) {
          Alert.alert('No se pudo activar push', registration.error ?? 'Intenta de nuevo desde Ajustes del teléfono.');
        }
      } else {
        await unregisterPushNotifications();
      }
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'No se pudieron guardar las preferencias'));
    } finally {
      setUpdatingNotifications(false);
    }
  }, []);

  const handleTestPush = useCallback(async () => {
    if (!notificationsEnabled) {
      Alert.alert('Notificaciones desactivadas', 'Activa las notificaciones push para enviar una prueba.');
      return;
    }

    setSendingTestPush(true);
    try {
      const registration = await registerPushNotificationsIfEnabled();
      if (!registration.success) {
        Alert.alert('Dispositivo no registrado', registration.error ?? 'No se pudo registrar el teléfono para push.');
        return;
      }

      const result = await enviarPushPrueba();
      Alert.alert('Push enviada', result.mensaje);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'No se pudo enviar la notificación de prueba'));
    } finally {
      setSendingTestPush(false);
    }
  }, [notificationsEnabled]);

  useFocusEffect(
    useCallback(() => {
      void loadUsuario();
    }, [loadUsuario])
  );

  const handleLogout = useCallback(() => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  }, [logout]);

  if (loading && !usuario) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.centeredState, { paddingHorizontal: Spacing.four }]}>
          <ActivityIndicator size="large" color={COLORS.orange} />
          <Text style={styles.stateText}>Cargando mi cuenta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!usuario) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.centeredState, { paddingHorizontal: Spacing.four }]}>
          <Ionicons name="cloud-offline-outline" size={40} color={COLORS.slateLight} />
          <Text style={styles.stateTitle}>No se pudo cargar tu cuenta</Text>
          <Text style={styles.stateText}>{error || 'Usuario no encontrado'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUsuario} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.logoutButtonText}>CERRAR SESIÓN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderMenuOption = (option: typeof MENU_OPTIONS[0]) => (
    <TouchableOpacity
      key={option.id}
      style={styles.menuOption}
      activeOpacity={0.7}
      onPress={() => {
        if (option.id === '1') {
          router.push('/editProfile');
        } else if (option.id === '2') {
          router.push('/followHistory');
        }
      }}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: `${option.color}15` }]}>
        <Ionicons name={option.icon as any} size={20} color={option.color} />
      </View>
      <Text style={styles.menuLabel}>{option.label}</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.slateLight} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Close Button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MI CUENTA</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <Animated.View 
          style={[
            styles.profileCard,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              {usuario.image ? (
                <Image source={{ uri: usuario.image }} style={styles.profileAvatarImage} contentFit="cover" />
              ) : (
                <Ionicons name="person" size={36} color={COLORS.orange} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{usuario.nombre_completo.toUpperCase()}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{usuario.rol}</Text>
              </View>
              <Text style={styles.profileClub}>{usuario.email}</Text>
            </View>
          </View>

          <View style={styles.profileDivider} />

          <View style={styles.profileDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="mail-outline" size={16} color={COLORS.orange} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Correo</Text>
                <Text style={styles.detailValue}>{usuario.email}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="call-outline" size={16} color={COLORS.orange} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Teléfono</Text>
                <Text style={styles.detailValue}>{usuario.telefono || '—'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="water-outline" size={16} color={COLORS.orange} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Rol</Text>
                <Text style={styles.detailValue}>{usuario.rol}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.orange} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Miembro desde</Text>
                <Text style={styles.detailValue}>{new Date(usuario.created_at).getFullYear()}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCIAS</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.orange} />
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceLabel}>Notificaciones push</Text>
                <Text style={styles.preferenceDescription}>
                  Alertas en el dispositivo por eventos y resultados
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => void handleNotificationsToggle(value)}
              disabled={updatingNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.orange }}
              thumbColor={notificationsEnabled ? COLORS.orange : COLORS.slateLight}
            />
          </View>

          {notificationsEnabled ? (
            <TouchableOpacity
              style={styles.testPushButton}
              activeOpacity={0.85}
              onPress={() => void handleTestPush()}
              disabled={sendingTestPush}
            >
              {sendingTestPush ? (
                <ActivityIndicator size="small" color={COLORS.orange} />
              ) : (
                <Ionicons name="paper-plane-outline" size={18} color={COLORS.orange} />
              )}
              <Text style={styles.testPushButtonText}>Enviar notificación de prueba</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Menu Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OPCIONES</Text>
          <View style={styles.menuContainer}>
            {MENU_OPTIONS.map(option => renderMenuOption(option))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.logoutButtonText}>CERRAR SESIÓN</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Arenas 360 v1.0</Text>
          <Text style={styles.footerSubtext}>© 2026 Todos los derechos reservados</Text>
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

  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateText: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryButtonText: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '900',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: COLORS.navy,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 10,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  closeButton: {
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

  // Profile Card
  profileCard: {
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.four,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.orange,
    backgroundColor: '#FFF5E8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
    fontStyle: 'italic',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE2B8',
    backgroundColor: '#FFF5E8',
  },
  categoryBadgeText: {
    color: COLORS.orangeDeep,
    fontSize: 10,
    fontWeight: '700',
  },
  profileClub: {
    color: COLORS.slate,
    fontSize: 12,
    fontWeight: '600',
  },
  profileDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: Spacing.four,
  },
  profileDetails: {
    gap: Spacing.three,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF5E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE2B8',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: '600',
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },

  // Section
  section: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  seeAllLink: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '700',
  },

  // Stats Grid


  // Preferences
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.045,
    shadowRadius: 14,
    elevation: 2,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  preferenceDescription: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  testPushButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testPushButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.orange,
  },

  // Menu
  menuContainer: {
    gap: 12,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.045,
    shadowRadius: 14,
    elevation: 2,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.red,
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: Spacing.four,
  },
  footerText: {
    color: COLORS.slate,
    fontSize: 12,
    fontWeight: '600',
  },
  footerSubtext: {
    color: COLORS.slateLight,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
});