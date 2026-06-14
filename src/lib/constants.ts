export const STORAGE_KEYS = {
  users: 'digischool_users',
  currentUser: 'digischool_current_user',
  muted: 'digischool_muted',
  playgroundBest: 'digischool_playground_best',
  studyResults: 'digischool_study_results',
  loginPracticeAccounts: 'digischool_login_practice_accounts',
} as const;

export const GUEST_USER_ID = 'digischool_guest';
export const GUEST_PROFILE_IMAGE_SRC = '/guest-profile-avatar.svg';

export type ModuleKey = 'keyboard' | 'typing' | 'mouse' | 'browser' | 'login';

export interface ModuleMeta {
  key: ModuleKey;
  label: string;
  shortLabel: string;
  icon: string;
  route: string;
  resultRoute: string;
  description: string;
  color: 'primary' | 'secondary' | 'tertiary' | 'error';
}

export const MODULES: ModuleMeta[] = [
  {
    key: 'keyboard',
    label: '키보드 학습',
    shortLabel: '키보드',
    icon: 'keyboard',
    route: '/keyboard',
    resultRoute: '/result/keyboard',
    description: '키보드의 여러 키를 익혀봐요!',
    color: 'primary',
  },
  {
    key: 'typing',
    label: '자판/타자 학습',
    shortLabel: '타자',
    icon: 'keyboard_alt',
    route: '/keyboard-typing',
    resultRoute: '/result/typing',
    description: '한글과 영어 자판 위치와 타자를 연습해요!',
    color: 'primary',
  },
  {
    key: 'mouse',
    label: '마우스 연습',
    shortLabel: '마우스',
    icon: 'mouse',
    route: '/mouse',
    resultRoute: '/result/mouse',
    description: '클릭, 더블클릭, 드래그를 연습해요!',
    color: 'secondary',
  },
  {
    key: 'browser',
    label: '인터넷 브라우저',
    shortLabel: '브라우저',
    icon: 'travel_explore',
    route: '/browser',
    resultRoute: '/result/browser',
    description: '인터넷에서 정보를 찾아봐요!',
    color: 'tertiary',
  },
  {
    key: 'login',
    label: '로그인/로그아웃',
    shortLabel: '로그인',
    icon: 'how_to_reg',
    route: '/login-practice',
    resultRoute: '/result/login',
    description: '안전한 로그인 방법을 배워요!',
    color: 'error',
  },
];

export function getModule(key: ModuleKey): ModuleMeta {
  const m = MODULES.find((x) => x.key === key);
  if (!m) throw new Error(`Unknown module key: ${key}`);
  return m;
}

export function isModuleKey(value: string | undefined | null): value is ModuleKey {
  return !!value && MODULES.some((m) => m.key === value);
}
