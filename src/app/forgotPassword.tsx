import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { apiPost, getApiErrorMessage } from '@/services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [debugToken, setDebugToken] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico');
      return;
    }

    setError('');
    setMessage('');
    setDebugToken('');
    setLoading(true);

    try {
      const data = await apiPost<{ message: string; debug_token?: string }>(
        '/api/auth/password-reset/request',
        { email: email.trim() },
        false
      );
      setMessage(data.message);
      if (data.debug_token) {
        setDebugToken(data.debug_token);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo procesar la solicitud'));
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
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#FF9F1C" />
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.title}>
                RECUPERAR <Text style={styles.titleOrange}>CONTRASEÑA</Text>
              </Text>
              <Text style={styles.subtitle}>
                Te enviaremos instrucciones si el correo está registrado en el sistema.
              </Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {message ? (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.successText}>{message}</Text>
                </View>
              ) : null}

              {debugToken ? (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugLabel}>Token de desarrollo (DEBUG):</Text>
                  <Text style={styles.debugToken} selectable>
                    {debugToken}
                  </Text>
                  <TouchableOpacity
                    style={styles.resetLink}
                    onPress={() =>
                      router.push({ pathname: '/resetPassword', params: { token: debugToken } })
                    }
                  >
                    <Text style={styles.resetLinkText}>Continuar con este token</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
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

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#001529" />
                ) : (
                  <Text style={styles.submitButtonText}>ENVIAR SOLICITUD</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  darkOverlay: { flex: 1, backgroundColor: 'rgba(0, 21, 41, 0.75)' },
  container: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingTop: Spacing.md },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.lg },
  backText: { color: '#FF9F1C', fontWeight: '600' },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.15)',
  },
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  titleOrange: { color: '#FF9F1C' },
  subtitle: { color: '#94A3B8', marginTop: 12, marginBottom: 24, lineHeight: 22 },
  formGroup: { marginBottom: 20 },
  label: { color: '#FF9F1C', fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  submitButton: {
    backgroundColor: '#FF9F1C',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#001529', fontWeight: '800', letterSpacing: 1 },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: { color: '#FCA5A5', flex: 1 },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: { color: '#6EE7B7', flex: 1 },
  debugContainer: {
    backgroundColor: 'rgba(32, 138, 239, 0.12)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  debugLabel: { color: '#93C5FD', fontSize: 12, marginBottom: 6 },
  debugToken: { color: '#F8FAFC', fontSize: 12 },
  resetLink: { marginTop: 10 },
  resetLinkText: { color: '#FF9F1C', fontWeight: '700' },
});
