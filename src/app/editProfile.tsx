import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { getApiErrorMessage } from '@/services/api';
import { updatePerfil, uploadFotoPerfil } from '@/services/usuario';

const COLORS = {
  navy: '#061629',
  slate: '#64748B',
  text: '#0F172A',
  white: '#FFFFFF',
  orange: '#FF9F1C',
  orangeDeep: '#F97316',
  border: '#E2E8F0',
  surface: '#F4F7FB',
  red: '#EF4444',
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { usuario, setSessionUsuario } = useAuth();

  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string | undefined>();
  const [photoFileName, setPhotoFileName] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario) {
      return;
    }

    setPrimerNombre(usuario.primer_nombre || '');
    setSegundoNombre(usuario.segundo_nombre || '');
    setPrimerApellido(usuario.primer_apellido || '');
    setSegundoApellido(usuario.segundo_apellido || '');
    setTelefono(usuario.telefono || '');
  }, [usuario]);

  const previewImage = photoUri || usuario?.image;

  const hasChanges = useMemo(() => {
    if (!usuario) {
      return false;
    }

    return (
      photoUri !== null ||
      primerNombre.trim() !== (usuario.primer_nombre || '') ||
      segundoNombre.trim() !== (usuario.segundo_nombre || '') ||
      primerApellido.trim() !== (usuario.primer_apellido || '') ||
      segundoApellido.trim() !== (usuario.segundo_apellido || '') ||
      telefono.trim() !== (usuario.telefono || '')
    );
  }, [usuario, photoUri, primerNombre, segundoNombre, primerApellido, segundoApellido, telefono]);

  const handlePickPhoto = useCallback(async () => {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    setPhotoMimeType(asset.mimeType || 'image/jpeg');
    setPhotoFileName(asset.fileName || `avatar-${Date.now()}.jpg`);
  }, []);

  const handleSave = useCallback(async () => {
    if (!usuario) {
      return;
    }

    if (!primerNombre.trim() || !primerApellido.trim()) {
      setError('Nombre y apellido son obligatorios');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let updated = usuario;

      if (photoUri) {
        updated = await uploadFotoPerfil(photoUri, photoFileName, photoMimeType);
      }

      updated = await updatePerfil({
        primer_nombre: primerNombre.trim(),
        segundo_nombre: segundoNombre.trim() || null,
        primer_apellido: primerApellido.trim(),
        segundo_apellido: segundoApellido.trim() || null,
        telefono: telefono.trim() || null,
      });

      await setSessionUsuario(updated);
      Alert.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el perfil'));
    } finally {
      setSaving(false);
    }
  }, [
    usuario,
    photoUri,
    photoFileName,
    photoMimeType,
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    telefono,
    setSessionUsuario,
    router,
  ]);

  if (!usuario) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDITAR PERFIL</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.avatarWrapper} onPress={() => void handlePickPhoto()} activeOpacity={0.85}>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={42} color={COLORS.orange} />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={16} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Toca para cambiar tu foto</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Correo</Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={usuario.email} editable={false} />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.flex]}>
              <Text style={styles.label}>Primer nombre *</Text>
              <TextInput
                style={styles.input}
                value={primerNombre}
                onChangeText={setPrimerNombre}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.fieldGroup, styles.flex]}>
              <Text style={styles.label}>Segundo nombre</Text>
              <TextInput
                style={styles.input}
                value={segundoNombre}
                onChangeText={setSegundoNombre}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.flex]}>
              <Text style={styles.label}>Primer apellido *</Text>
              <TextInput
                style={styles.input}
                value={primerApellido}
                onChangeText={setPrimerApellido}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.fieldGroup, styles.flex]}>
              <Text style={styles.label}>Segundo apellido</Text>
              <TextInput
                style={styles.input}
                value={segundoApellido}
                onChangeText={setSegundoApellido}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
            onPress={() => void handleSave()}
            disabled={!hasChanges || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.navy} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={COLORS.navy} />
                <Text style={styles.saveButtonText}>GUARDAR CAMBIOS</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: COLORS.navy,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  avatarWrapper: {
    alignSelf: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: COLORS.orange,
  },
  avatarFallback: {
    backgroundColor: '#FFF5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.orangeDeep,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarHint: {
    textAlign: 'center',
    color: COLORS.slate,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: COLORS.slate,
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  inputDisabled: {
    backgroundColor: '#EEF2F7',
    color: COLORS.slate,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.orange,
    borderRadius: 18,
    paddingVertical: 16,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '900',
  },
});
