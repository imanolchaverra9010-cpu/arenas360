import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import type { Usuario } from '@/types/usuario';
import { apiPost, getApiErrorMessage } from '@/services/api';
import {
  fetchPublicTenants,
  previewInvitation,
  type InvitacionPreview,
  type TenantPublicItem,
} from '@/services/tenants';

const { width } = Dimensions.get('window');

type RegistrationMode = 'organization' | 'invitation';

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().replace(/\s+/g, ' ').split(' ');
  return {
    primer_nombre: parts[0] || '',
    segundo_nombre: parts.length > 2 ? parts.slice(1, -1).join(' ') : undefined,
    primer_apellido: parts.length > 1 ? parts[parts.length - 1] : '',
  };
};

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ invite?: string }>();
  const { login } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>(
    params.invite ? 'invitation' : 'organization'
  );
  const [tenants, setTenants] = useState<TenantPublicItem[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [tenantPickerOpen, setTenantPickerOpen] = useState(false);
  const [invitationToken, setInvitationToken] = useState(params.invite ? String(params.invite) : '');
  const [invitationPreview, setInvitationPreview] = useState<InvitacionPreview | null>(null);
  const [invitationChecking, setInvitationChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId) ?? null;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    let mounted = true;

    async function loadTenants() {
      setTenantsLoading(true);
      try {
        const items = await fetchPublicTenants();
        if (!mounted) {
          return;
        }
        setTenants(items);
        if (items.length === 1) {
          setSelectedTenantId(items[0].id);
        }
      } catch {
        if (mounted) {
          setError('No se pudieron cargar las organizaciones disponibles');
        }
      } finally {
        if (mounted) {
          setTenantsLoading(false);
        }
      }
    }

    void loadTenants();
    return () => {
      mounted = false;
    };
  }, []);

  const validateInvitation = useCallback(async (token: string, userEmail: string) => {
    const trimmedToken = token.trim();
    const trimmedEmail = userEmail.trim().toLowerCase();

    if (!trimmedToken || !trimmedEmail || !trimmedEmail.includes('@')) {
      setInvitationPreview(null);
      return;
    }

    setInvitationChecking(true);
    try {
      const preview = await previewInvitation(trimmedToken, trimmedEmail);
      setInvitationPreview(preview);
      setError('');
    } catch (err) {
      setInvitationPreview(null);
      setError(getApiErrorMessage(err, 'Invitación no válida'));
    } finally {
      setInvitationChecking(false);
    }
  }, []);

  useEffect(() => {
    if (registrationMode !== 'invitation') {
      setInvitationPreview(null);
      return;
    }

    if (previewTimer.current) {
      clearTimeout(previewTimer.current);
    }

    previewTimer.current = setTimeout(() => {
      void validateInvitation(invitationToken, email);
    }, 450);

    return () => {
      if (previewTimer.current) {
        clearTimeout(previewTimer.current);
      }
    };
  }, [registrationMode, invitationToken, email, validateInvitation]);

  const handleRegister = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (registrationMode === 'organization' && !selectedTenantId) {
      setError('Selecciona la organización a la que perteneces');
      return;
    }

    if (registrationMode === 'invitation') {
      if (!invitationToken.trim()) {
        setError('Ingresa el código de invitación');
        return;
      }
      if (!invitationPreview?.valid) {
        setError('Verifica el código de invitación y el correo antes de continuar');
        return;
      }
    }

    if (trimmedName.split(/\s+/).length < 2) {
      setError('Ingresa nombre y apellido');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload =
        registrationMode === 'invitation'
          ? {
              ...splitFullName(trimmedName),
              email: trimmedEmail,
              password,
              invitation_token: invitationToken.trim(),
            }
          : {
              ...splitFullName(trimmedName),
              email: trimmedEmail,
              password,
              tenant_id: selectedTenantId,
            };

      const data = await apiPost<{
        access_token: string;
        usuario: Usuario;
      }>('/api/auth/register', payload, false);

      await login(data.access_token, data.usuario);

      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setInvitationToken('');
      setInvitationPreview(null);
      setSelectedTenantId(null);

      router.replace('/events');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo conectar al servidor. Verifica que el backend esté corriendo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=1000&auto=format&fit=crop' }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.darkOverlay}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View
                style={[
                  styles.card,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.titleSection}>
                  <Text style={styles.title}>
                    CREAR <Text style={styles.titleOrange}>CUENTA</Text>
                  </Text>
                  <Text style={styles.subtitle}>
                    Elige tu organización o usa el código que te enviaron por correo
                  </Text>
                </View>

                <View style={styles.decorativeLine} />

                <View style={styles.modeSwitch}>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      registrationMode === 'organization' && styles.modeButtonActive,
                    ]}
                    onPress={() => {
                      setRegistrationMode('organization');
                      setError('');
                      setInvitationPreview(null);
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons
                      name="business-outline"
                      size={16}
                      color={registrationMode === 'organization' ? '#001529' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.modeButtonText,
                        registrationMode === 'organization' && styles.modeButtonTextActive,
                      ]}
                    >
                      Organización
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      registrationMode === 'invitation' && styles.modeButtonActive,
                    ]}
                    onPress={() => {
                      setRegistrationMode('invitation');
                      setError('');
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons
                      name="mail-open-outline"
                      size={16}
                      color={registrationMode === 'invitation' ? '#001529' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.modeButtonText,
                        registrationMode === 'invitation' && styles.modeButtonTextActive,
                      ]}
                    >
                      Invitación
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.form}>
                  {error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color="#EF4444" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {registrationMode === 'organization' ? (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>ORGANIZACIÓN</Text>
                      <TouchableOpacity
                        style={styles.selectWrapper}
                        onPress={() => setTenantPickerOpen(true)}
                        activeOpacity={0.88}
                        disabled={tenantsLoading || loading}
                      >
                        {tenantsLoading ? (
                          <ActivityIndicator color="#FF9F1C" size="small" />
                        ) : (
                          <>
                            <Ionicons name="business-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                            <Text
                              style={[
                                styles.selectText,
                                !selectedTenant && styles.selectPlaceholder,
                              ]}
                              numberOfLines={1}
                            >
                              {selectedTenant?.nombre ?? 'Selecciona tu club u organización'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>CÓDIGO DE INVITACIÓN</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="key-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Pega el código recibido por correo"
                            placeholderTextColor="#64748b"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={invitationToken}
                            onChangeText={setInvitationToken}
                            editable={!loading}
                          />
                        </View>
                      </View>

                      {invitationChecking ? (
                        <View style={styles.previewBox}>
                          <ActivityIndicator color="#FF9F1C" size="small" />
                          <Text style={styles.previewText}>Verificando invitación...</Text>
                        </View>
                      ) : null}

                      {invitationPreview?.valid ? (
                        <View style={styles.previewBoxSuccess}>
                          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                          <View style={styles.previewContent}>
                            <Text style={styles.previewTitle}>{invitationPreview.tenant_nombre}</Text>
                            <Text style={styles.previewText}>
                              Invitación válida para {invitationPreview.email}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>NOMBRE COMPLETO</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Tu nombre completo"
                        placeholderTextColor="#64748b"
                        autoCapitalize="words"
                        value={fullName}
                        onChangeText={setFullName}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="tu@correo.com"
                        placeholderTextColor="#64748b"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>CONTRASEÑA</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#64748b"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="shield-checkmark-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#64748b"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                    activeOpacity={0.9}
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#001529" size="small" />
                    ) : (
                      <>
                        <Text style={styles.registerButtonText}>REGISTRARME</Text>
                        <Ionicons name="arrow-forward" size={20} color="#001529" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.footerLinkContainer}>
                  <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
                  <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.footerLink}>Inicia Sesión</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>

      <Modal
        visible={tenantPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setTenantPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setTenantPickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona tu organización</Text>
              <TouchableOpacity onPress={() => setTenantPickerOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {tenants.map((tenant) => {
                const isSelected = tenant.id === selectedTenantId;
                return (
                  <TouchableOpacity
                    key={tenant.id}
                    style={[styles.tenantOption, isSelected && styles.tenantOptionActive]}
                    onPress={() => {
                      setSelectedTenantId(tenant.id);
                      setTenantPickerOpen(false);
                      setError('');
                    }}
                    activeOpacity={0.88}
                  >
                    <Text style={[styles.tenantOptionText, isSelected && styles.tenantOptionTextActive]}>
                      {tenant.nombre}
                    </Text>
                    {isSelected ? <Ionicons name="checkmark-circle" size={20} color="#FF9F1C" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 21, 41, 0.75)',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.five,
  },
  card: {
    backgroundColor: 'rgba(0, 29, 61, 0.45)',
    marginHorizontal: Spacing.four,
    padding: Spacing.five,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: 'white',
    letterSpacing: 0.5,
  },
  titleOrange: {
    color: '#FF9F1C',
  },
  subtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  decorativeLine: {
    height: 1,
    backgroundColor: 'rgba(26, 58, 90, 0.5)',
    width: '100%',
    marginBottom: 20,
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(10, 33, 61, 0.55)',
  },
  modeButtonActive: {
    backgroundColor: '#FF9F1C',
    borderColor: '#FF9F1C',
  },
  modeButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },
  modeButtonTextActive: {
    color: '#001529',
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 33, 61, 0.65)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
  },
  selectWrapper: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 33, 61, 0.65)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
  },
  selectText: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  selectPlaceholder: {
    color: '#64748b',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 159, 28, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.22)',
  },
  previewBoxSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  previewContent: {
    flex: 1,
    gap: 2,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  previewText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  registerButton: {
    backgroundColor: '#FF9F1C',
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 10,
    shadowColor: '#FF9F1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#001529',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  footerLink: {
    color: '#FF9F1C',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  modalList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tenantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tenantOptionActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF9F1C',
  },
  tenantOptionText: {
    flex: 1,
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
    paddingRight: 12,
  },
  tenantOptionTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
});
