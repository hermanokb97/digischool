import { GUEST_USER_ID, STORAGE_KEYS } from './constants';

let guestSession = false;

export function setGuestSession(enabled: boolean) {
  guestSession = enabled;
}

export function isGuestSession(): boolean {
  return guestSession;
}

export function isGuestUserId(userId: string | undefined | null): boolean {
  return userId === GUEST_USER_ID;
}

export function canPersistUserData(): boolean {
  if (typeof window === 'undefined' || guestSession) return false;

  try {
    const rawCurrentUser = localStorage.getItem(STORAGE_KEYS.currentUser);
    if (!rawCurrentUser) return false;

    const currentUser = JSON.parse(rawCurrentUser) as { id?: string; isGuest?: boolean } | null;
    return !!currentUser && currentUser.id !== GUEST_USER_ID && currentUser.isGuest !== true;
  } catch {
    return false;
  }
}
