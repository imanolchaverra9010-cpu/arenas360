import type { Router } from 'expo-router';

export type NotificationPayload = {
  eventId?: string;
  athleteId?: string;
  resultId?: string;
  eventoPruebaId?: string;
};

export function navigateFromNotificationPayload(router: Router, raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    return;
  }

  const payload = raw as NotificationPayload;

  if (payload.resultId) {
    router.push({ pathname: '/resultDetails', params: { resultId: payload.resultId } });
    return;
  }

  if (payload.eventoPruebaId) {
    router.push({
      pathname: '/competitionDetails',
      params: { eventoPruebaId: payload.eventoPruebaId },
    });
    return;
  }

  if (payload.eventId) {
    router.push({ pathname: '/eventDetails', params: { eventId: payload.eventId } });
    return;
  }

  if (payload.athleteId) {
    router.push({ pathname: '/profile', params: { athleteId: payload.athleteId } });
  }
}
