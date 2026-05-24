import * as Notifications from 'expo-notifications';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import {
  ensureNotificationHandler,
  registerPushNotificationsIfEnabled,
  unregisterPushNotifications,
} from '@/services/push-notifications';
import { navigateFromNotificationPayload } from '@/utils/notification-navigation';

export function PushNotificationHandler() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const navigationReady = Boolean(rootNavigationState?.key);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    ensureNotificationHandler();
  }, []);

  const lastRegistrationAttempt = useRef(0);

  useEffect(() => {
    if (!navigationReady || isLoading || !isAuthenticated) {
      return;
    }

    const register = async () => {
      const result = await registerPushNotificationsIfEnabled();
      if (!result.success && result.error) {
        console.warn('[push] Registro fallido:', result.error);
      }
    };

    void register();
  }, [navigationReady, isLoading, isAuthenticated]);

  useEffect(() => {
    if (!navigationReady || isLoading || !isAuthenticated) {
      return;
    }

    const retryOnForeground = (state: AppStateStatus) => {
      if (state !== 'active') {
        return;
      }

      const now = Date.now();
      if (now - lastRegistrationAttempt.current < 30_000) {
        return;
      }

      lastRegistrationAttempt.current = now;
      void registerPushNotificationsIfEnabled();
    };

    const subscription = AppState.addEventListener('change', retryOnForeground);
    return () => subscription.remove();
  }, [navigationReady, isLoading, isAuthenticated]);

  useEffect(() => {
    if (!navigationReady) {
      return;
    }

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        navigateFromNotificationPayload(router, response.notification.request.content.data);
      }
    );

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        navigateFromNotificationPayload(router, response.notification.request.content.data);
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, [navigationReady, router]);

  useEffect(() => {
    if (isAuthenticated || isLoading) {
      return;
    }

    void unregisterPushNotifications();
  }, [isAuthenticated, isLoading]);

  return null;
}
