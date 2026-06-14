import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { GUEST_USER_ID, STORAGE_KEYS, ModuleKey } from '@/lib/constants';
import { isGuestUserId, setGuestSession } from '@/lib/sessionMode';

export type AvatarId = 'bear' | 'robot' | 'cat' | 'dino' | 'unicorn' | 'fox' | 'guest';

export interface User {
  id: string;
  nickname: string;
  avatar: AvatarId;
  progress: Record<ModuleKey, boolean>;
  lastStudiedAt?: Record<ModuleKey, string | undefined>;
  createdAt: string;
  isGuest?: boolean;
}

interface UserContextType {
  users: User[];
  user: User | null;
  register: (nickname: string, avatar: AvatarId) => User;
  enterAsGuest: () => User;
  login: (id: string) => void;
  updateProgress: (mission: ModuleKey, completed: boolean) => void;
  markComplete: (mission: ModuleKey) => void;
  resetProgress: (mission: ModuleKey) => void;
  removeUser: (id: string) => void;
  isNicknameTaken: (nickname: string, exceptId?: string) => boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEFAULT_USERS: User[] = [];

function createEmptyProgress(progress?: Partial<Record<ModuleKey, boolean>>): User['progress'] {
  return {
    keyboard: !!progress?.keyboard,
    typing: !!progress?.typing,
    mouse: !!progress?.mouse,
    browser: !!progress?.browser,
    login: !!progress?.login,
  };
}

function createGuestUser(): User {
  return {
    id: GUEST_USER_ID,
    nickname: '손님',
    avatar: 'guest',
    progress: createEmptyProgress(),
    createdAt: new Date().toISOString(),
    isGuest: true,
  };
}

function isLegacyDefaultUser(user: User): boolean {
  return (
    (user.id === '1' && user.nickname === '새싹 친구') ||
    (user.id === '2' && user.nickname === '똑똑 로봇')
  );
}

function normalizeUser(user: User): User {
  return {
    ...user,
    progress: createEmptyProgress(user.progress),
  };
}

function normalizeStoredUsers(value: unknown): User[] {
  if (!Array.isArray(value)) return DEFAULT_USERS;
  return value
    .filter((user): user is User => {
      if (!user || typeof user !== 'object') return false;
      const candidate = user as User;
      return !candidate.isGuest && !isGuestUserId(candidate.id) && !isLegacyDefaultUser(candidate);
    })
    .map(normalizeUser);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const usersRef = useRef<User[]>([]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    const storedUsers = localStorage.getItem(STORAGE_KEYS.users);
    let loadedUsers = DEFAULT_USERS;
    if (storedUsers) {
      try {
        loadedUsers = normalizeStoredUsers(JSON.parse(storedUsers));
      } catch {
        loadedUsers = DEFAULT_USERS;
      }
    }

    setUsers(loadedUsers);
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(loadedUsers));

    const storedCurrentUser = localStorage.getItem(STORAGE_KEYS.currentUser);
    if (storedCurrentUser) {
      try {
        const parsedCurrentUser = JSON.parse(storedCurrentUser) as User;
        const storedUser = loadedUsers.find((candidate) => candidate.id === parsedCurrentUser.id);
        const canRestore =
          !parsedCurrentUser.isGuest &&
          !isGuestUserId(parsedCurrentUser.id) &&
          !isLegacyDefaultUser(parsedCurrentUser) &&
          !!storedUser;

        if (canRestore && storedUser) {
          setGuestSession(false);
          setUser(storedUser);
          localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(storedUser));
        } else {
          localStorage.removeItem(STORAGE_KEYS.currentUser);
          setGuestSession(false);
        }
      } catch {
        console.error('Failed to parse current user');
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        setGuestSession(false);
      }
    } else {
      setGuestSession(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(
        STORAGE_KEYS.users,
        JSON.stringify(users.filter((storedUser) => !storedUser.isGuest && !isGuestUserId(storedUser.id))),
      );
    }
  }, [users, loading]);

  const register = useCallback((nickname: string, avatar: AvatarId): User => {
    const newUser: User = {
      id: Date.now().toString(),
      nickname,
      avatar,
      progress: createEmptyProgress(),
      createdAt: new Date().toISOString(),
    };
    setGuestSession(false);
    setUsers((prev) => [...prev, newUser]);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(newUser));
    return newUser;
  }, []);

  const enterAsGuest = useCallback((): User => {
    const guest = createGuestUser();
    setGuestSession(true);
    setUser(guest);
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    return guest;
  }, []);

  const login = useCallback((id: string) => {
    const found = usersRef.current.find((u) => u.id === id);
    if (found) {
      setGuestSession(false);
      setUser(found);
      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(found));
    }
  }, []);

  const updateProgress = useCallback((mission: ModuleKey, completed: boolean) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: User = {
        ...prev,
        progress: { ...prev.progress, [mission]: completed },
        lastStudiedAt: {
          ...(prev.lastStudiedAt ?? ({} as Record<ModuleKey, string | undefined>)),
          [mission]: completed ? new Date().toISOString() : prev.lastStudiedAt?.[mission],
        },
      };
      if (prev.isGuest || isGuestUserId(prev.id)) {
        return updated;
      }
      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(updated));
      setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)));
      return updated;
    });
  }, []);

  const markComplete = useCallback((mission: ModuleKey) => updateProgress(mission, true), [updateProgress]);
  const resetProgress = useCallback((mission: ModuleKey) => updateProgress(mission, false), [updateProgress]);

  const removeUser = useCallback((id: string) => {
    setUsers((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((u) => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(next));
      return next;
    });
    setUser((prev) => {
      if (prev && prev.id === id) {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        return null;
      }
      return prev;
    });
  }, []);

  const isNicknameTaken = useCallback((nickname: string, exceptId?: string) => {
    const normalized = nickname.trim().toLowerCase();
    return usersRef.current.some(
      (u) => u.nickname.trim().toLowerCase() === normalized && u.id !== exceptId,
    );
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setGuestSession(false);
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }, []);

  const value = useMemo<UserContextType>(
    () => ({
      users,
      user,
      register,
      enterAsGuest,
      login,
      updateProgress,
      markComplete,
      resetProgress,
      removeUser,
      isNicknameTaken,
      logout,
    }),
    [users, user, register, enterAsGuest, login, updateProgress, markComplete, resetProgress, removeUser, isNicknameTaken, logout],
  );

  if (loading) return null;

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
