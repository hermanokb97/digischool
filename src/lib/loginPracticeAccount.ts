import { STORAGE_KEYS } from './constants';
import { isGuestSession, isGuestUserId } from './sessionMode';

export interface LoginPracticeAccount {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

type StoredAccounts = Record<string, LoginPracticeAccount>;

const transientAccounts: StoredAccounts = {};

function readAccounts(): StoredAccounts {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.loginPracticeAccounts) ?? '{}');
  } catch {
    return {};
  }
}

export function getLoginPracticeAccount(userId: string | undefined | null): LoginPracticeAccount | null {
  if (!userId) return null;
  if (isGuestUserId(userId) || isGuestSession()) return transientAccounts[userId] ?? null;
  return readAccounts()[userId] ?? null;
}

export function saveLoginPracticeAccount(userId: string | undefined | null, account: LoginPracticeAccount) {
  if (!userId || typeof window === 'undefined') return;
  if (isGuestUserId(userId) || isGuestSession()) {
    transientAccounts[userId] = account;
    return;
  }

  const accounts = readAccounts();
  localStorage.setItem(
    STORAGE_KEYS.loginPracticeAccounts,
    JSON.stringify({
      ...accounts,
      [userId]: account,
    }),
  );
}
