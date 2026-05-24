import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ErrorBoundary } from '@/components/error-boundary';
import { PushNotificationHandler } from '@/components/push-notification-handler';
import { AuthProvider } from '@/contexts/auth-context';
import { OfflineProvider } from '@/contexts/offline-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <PushNotificationHandler />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgotPassword" />
        <Stack.Screen name="resetPassword" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="eventDetails" options={{ presentation: 'card', title: 'Detalles del Evento' }} />
        <Stack.Screen name="eventSchedule" options={{ presentation: 'card', title: 'Calendario del Evento' }} />
        <Stack.Screen name="resultDetails" options={{ presentation: 'card', title: 'Resultados Detallados' }} />
        <Stack.Screen name="profile" options={{ presentation: 'card', title: 'Perfil' }} />
        <Stack.Screen name="editProfile" options={{ presentation: 'card', title: 'Editar Perfil' }} />
        <Stack.Screen name="followHistory" options={{ presentation: 'card', title: 'Historial Completo' }} />
        <Stack.Screen name="compareAthletes" options={{ presentation: 'card', title: 'Comparar Atletas' }} />
        <Stack.Screen name="disciplineDetails" options={{ presentation: 'card', title: 'Detalle de Disciplina' }} />
        <Stack.Screen name="competitionDetails" options={{ presentation: 'card', title: 'Detalle de Competición' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (Platform.OS === 'android') {
      void SystemUI.setBackgroundColorAsync('#F4F7FB');
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <ErrorBoundary>
          <OfflineProvider>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </OfflineProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
