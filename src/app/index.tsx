import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageBackground,
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

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await apiPost<{
        access_token: string;
        usuario: Usuario;
      }>('/api/auth/login', { email, password }, false);

      await login(data.access_token, data.usuario);
      setEmail('');
      setPassword('');
      router.replace('/events');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo conectar al servidor. Verifica que el backend esté corriendo.'));
      console.error('Login error:', err);
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
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Animated Card */}
            <Animated.View 
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>
                  INICIAR <Text style={styles.titleOrange}>SESIÓN</Text>
                </Text>
                <Text style={styles.subtitle}>
                  Accede a tu cuenta y gestiona tu perfil de forma segura
                </Text>
              </View>

              {/* Decorative Line */}
              <View style={styles.decorativeLine} />

              {/* Form Section */}
              <View style={styles.formSection}>
                {/* Error Message */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Email Input */}
                <View style={styles.formGroup}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="mail-outline" size={14} color="#FF9F1C" />
                    <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="tu@correo.com"
                    placeholderTextColor="#475569"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.formGroup}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="lock-closed-outline" size={14} color="#FF9F1C" />
                    <Text style={styles.label}>CONTRASEÑA</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                </View>

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsContainer}>
                  <TouchableOpacity style={styles.checkboxContainer}>
                    <View style={styles.checkbox} />
                    <Text style={styles.checkboxLabel}>Recuérdame</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/forgotPassword')}>
                    <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                activeOpacity={0.9}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#001529" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>INGRESAR</Text>
                    <Ionicons name="arrow-forward" size={18} color="#001529" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Footer Link */}
              <View style={styles.footerLinkContainer}>
                <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text style={styles.footerLink}>Regístrate</Text>
                </TouchableOpacity>
              </View>

              {/* Security Info */}
              <View style={styles.securityInfo}>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text style={styles.securityText}>Tu información está protegida con encriptación</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
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
    backgroundColor: 'rgba(0, 21, 41, 0.75)', // elegant dark overlay
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

  // Card Styles
  card: {
    backgroundColor: 'rgba(0, 29, 61, 0.45)', // beautiful translucent blue glassmorphism
    marginHorizontal: Spacing.four,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.five,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#FF9F1C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  // Title Section
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    fontStyle: 'italic',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  titleOrange: {
    color: '#FF9F1C',
  },
  subtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },

  // Decorative Line
  decorativeLine: {
    height: 2,
    backgroundColor: 'rgba(255, 159, 28, 0.3)',
    borderRadius: 1,
    marginBottom: 24,
  },

  // Google Button
  googleButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 32,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIconContainer: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#001529',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Apple Button
  appleButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  appleIconContainer: {
    marginRight: 12,
  },
  appleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Separator
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1A3A5A',
  },
  separatorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1A3A5A',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    backgroundColor: 'rgba(255, 159, 28, 0.05)',
  },
  separatorText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },

  // Form Section
  formSection: {
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: 'rgba(10, 33, 61, 0.65)', // translucent dark blue
    borderRadius: 32,
    paddingVertical: 14,
    paddingHorizontal: 20,
    color: 'white',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)', // brighter border for clear boundary
    fontWeight: '500',
  },

  // Options Container
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FF9F1C',
    backgroundColor: 'transparent',
  },
  checkboxLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  forgotPassword: {
    color: '#FF9F1C',
    fontSize: 13,
    fontWeight: '600',
  },

  // Login Button
  loginButton: {
    backgroundColor: '#FF9F1C',
    borderRadius: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#FF9F1C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#001529',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  buttonIcon: {
    marginLeft: 8,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#1A3A5A',
    marginBottom: 20,
  },

  // Footer Link
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  footerLink: {
    color: '#FF9F1C',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Security Info
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  securityText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
