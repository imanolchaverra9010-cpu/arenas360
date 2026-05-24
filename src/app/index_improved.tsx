import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';

import { Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              <Ionicons name="menu-outline" size={24} color="#FF9F1C" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle-outline" size={24} color="#FF9F1C" />
            </TouchableOpacity>
          </View>
        </View>

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

          {/* Google Button */}
          <TouchableOpacity 
            style={styles.googleButton}
            activeOpacity={0.85}
          >
            <View style={styles.googleIconContainer}>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
            </View>
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </TouchableOpacity>

          {/* Separator */}
          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <View style={styles.separatorCircle}>
              <Text style={styles.separatorText}>o</Text>
            </View>
            <View style={styles.separatorLine} />
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
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
              />
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity style={styles.checkboxContainer}>
                <View style={styles.checkbox} />
                <Text style={styles.checkboxLabel}>Recuérdame</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.loginButton}
            activeOpacity={0.9}
          >
            <Text style={styles.loginButtonText}>INGRESAR</Text>
            <Ionicons name="arrow-forward" size={18} color="#001529" style={styles.buttonIcon} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Footer Link */}
          <View style={styles.footerLinkContainer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.footerLink}>Regístrate aquí</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001529',
  },
  scrollContent: {
    paddingBottom: Spacing.four,
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
    backgroundColor: 'rgba(255, 159, 28, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF9F1C',
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
    backgroundColor: 'rgba(255, 159, 28, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.3)',
  },

  // Card Styles
  card: {
    backgroundColor: '#001D3D',
    marginHorizontal: Spacing.four,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.five,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1A3A5A',
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
    marginBottom: 24,
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
    backgroundColor: '#0A213D',
    borderRadius: 32,
    paddingVertical: 14,
    paddingHorizontal: 20,
    color: 'white',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#1A3A5A',
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
