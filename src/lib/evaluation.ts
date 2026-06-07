import { ModuleKey, STORAGE_KEYS } from './constants';
import { canPersistUserData, isGuestSession } from './sessionMode';

export interface StudyResult {
  module: ModuleKey;
  durationMs: number;
  completedAt: string;
  rating: 'excellent' | 'good' | 'steady';
  details?: StudyResultDetails;
}

export type KeyboardTrack = 'ko' | 'en';

export interface KeyboardTrackResult {
  label: string;
  positionAccuracy: number;
  typingAccuracy: number;
  mistakes: number;
  elapsedMs: number;
  cpm: number;
  completedAt: string;
}

export interface StudyResultDetails {
  keyboardTracks?: Partial<Record<KeyboardTrack, KeyboardTrackResult>>;
}

const TARGET_SECONDS: Record<ModuleKey, { excellent: number; good: number }> = {
  keyboard: { excellent: 120, good: 240 },
  mouse: { excellent: 90, good: 180 },
  browser: { excellent: 180, good: 360 },
  login: { excellent: 120, good: 240 },
};

const transientResults: Partial<Record<ModuleKey, StudyResult>> = {};

function readResults(): Partial<Record<ModuleKey, StudyResult>> {
  if (typeof window === 'undefined') return {};
  if (isGuestSession()) return transientResults;
  if (!canPersistUserData()) return {};

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.studyResults) ?? '{}');
  } catch {
    return {};
  }
}

function getRating(module: ModuleKey, durationMs: number): StudyResult['rating'] {
  const seconds = Math.round(durationMs / 1000);
  const target = TARGET_SECONDS[module];
  if (seconds <= target.excellent) return 'excellent';
  if (seconds <= target.good) return 'good';
  return 'steady';
}

function mergeDetails(existing: StudyResult['details'], next?: StudyResultDetails): StudyResult['details'] | undefined {
  if (!next) return existing;
  return {
    ...existing,
    ...next,
    keyboardTracks: {
      ...(existing?.keyboardTracks ?? {}),
      ...(next.keyboardTracks ?? {}),
    },
  };
}

export function saveStudyResult(module: ModuleKey, startedAt: number, details?: StudyResultDetails): StudyResult {
  const durationMs = Math.max(1000, Date.now() - startedAt);
  const existing = readResults()[module];
  const result: StudyResult = {
    module,
    durationMs,
    completedAt: new Date().toISOString(),
    rating: getRating(module, durationMs),
    details: mergeDetails(existing?.details, details),
  };

  if (isGuestSession()) {
    transientResults[module] = result;
    return result;
  }

  if (canPersistUserData()) {
    const next = { ...readResults(), [module]: result };
    localStorage.setItem(STORAGE_KEYS.studyResults, JSON.stringify(next));
  }

  return result;
}

export function getStudyResult(module: ModuleKey): StudyResult | undefined {
  return readResults()[module];
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}초`;
  return `${minutes}분 ${seconds}초`;
}

export function getEvaluationLabel(rating: StudyResult['rating']): string {
  if (rating === 'excellent') return '아주 빠르고 정확했어요!';
  if (rating === 'good') return '차분하게 잘 해냈어요!';
  return '끝까지 포기하지 않고 완료했어요!';
}
