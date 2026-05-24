import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(tokenParam ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!token.trim() || !password || !confirmPassword) {
      setError('Completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await apiPost(
        '/api/auth/password-reset/confirm',
        { token: token.trim(), password },
        false
      );
      router.replace('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo restablecer la contraseña'));
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
                NUEVA <Text style={styles.titleOrange}>CONTRASEÑA</Text>
              </Text>
              <Text style={styles.subtitle}>Ingresa el token recibido y tu nueva contraseña.</Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <Text style={styles.label}>TOKEN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Token de recuperación"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  value={token}
                  onChangeText={setToken}
                  editable={!loading}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repite la contraseña"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
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
                  <Text style={styles.submitButtonText}>ACTUALIZAR CONTRASEÑA</Text>
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
});
