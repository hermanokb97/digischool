# Vibe Coding Context - Digi School

Last updated: 2026-05-02

이 문서는 다음 바이브코딩/AI 코딩 도구가 프로젝트의 현재 흐름을 빠르게 이어받기 위한 작업 맥락이다.

## 프로젝트 목적

Digi School은 초등학생을 위한 디지털 리터러시 학습 웹앱이다. 키보드, 마우스, 인터넷 브라우저, 회원가입/로그인/로그아웃을 실제 컴퓨터 조작처럼 게임형 미션으로 연습하게 한다.

## 기술 스택

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router v7
- `motion/react` 애니메이션
- 서버 없이 `localStorage` 기반으로 사용자, 진행도, 음소거, 학습 결과, 미니게임 최고 기록을 저장

## 실행 명령

```bash
npm install
npm run dev
npm run lint
npm run build
```

개발 서버는 `package.json` 기준 `vite --port=3000 --host=0.0.0.0`로 실행된다.

## 현재 앱 구조

- `src/App.tsx`: 라우팅, 인증 가드, 전체 Provider 구성
- `src/context/UserContext.tsx`: 사용자 목록, 현재 사용자, 진행도, 마지막 학습 시간 관리
- `src/lib/constants.ts`: 학습 모듈 메타데이터와 `localStorage` 키 정의
- `src/lib/evaluation.ts`: 학습 완료 시간 저장, 등급 산정, 시간 표시
- `src/lib/sound.ts`: 효과음, 팡파르, 한국어 TTS, 음소거 상태 관리
- `src/components/VirtualDesktop.tsx`: 마우스 학습/평가에서 쓰는 공통 가상 바탕화면 프레임, 아이콘, 창, 선택 영역, 창 컨트롤
- `src/components/layout/*`: 데스크톱 상단 내비게이션, 모바일 하단 내비게이션, 공통 레이아웃
- `src/pages/*`: 회원 선택, 홈, 대시보드, 각 학습 모듈, 결과, 성장 기록, 평가, 연습장

## 핵심 사용자 흐름

1. 사용자가 `/register`에서 기존 친구를 선택하거나 새 친구를 추가한다.
2. 선택된 친구는 `digischool_current_user`에 저장되고, 전체 사용자 목록은 `digischool_users`에 저장된다.
3. 로그인된 사용자는 `/` 홈으로 이동하며, 아직 완료하지 않은 첫 번째 모듈을 다음 학습으로 안내받는다.
4. `/dashboard`에서 네 가지 학습 모듈 상태를 확인하고 원하는 모듈로 들어간다.
5. 각 모듈을 끝내면 `saveStudyResult(module, startedAt)`로 완료 시간과 평가 등급을 저장한다.
6. 각 모듈은 `markComplete(module)`을 호출해 사용자 진행도와 마지막 학습 시간을 갱신한다.
7. 완료 후 `/result/:module`로 이동해 수료증, 걸린 시간, 평가 문구, 다음 학습 버튼을 보여준다.
8. `/growth`에서 모듈별 완료 여부, 마지막 학습일, 시간 평가를 확인하거나 완료 상태를 초기화할 수 있다.
9. `/evaluation`은 별도 퀴즈 평가 화면으로, 키보드 평가와 가상 바탕화면 실기 평가를 제공한다. 로그인/로그아웃 평가는 별도 탭이 아니라 가상 브라우저의 Google 로그인/계정 메뉴/로그아웃 흐름 안에 통합되어 있다.
10. `/playground`는 자유 연습과 15초 클릭 미니게임을 제공하며 최고 기록만 저장한다.

## 학습 모듈

| key | route | result route | 내용 |
| --- | --- | --- | --- |
| `keyboard` | `/keyboard` | `/result/keyboard` | Enter, Space, Backspace, A, 숫자, Shift/CapsLock/Ctrl/Alt/Tab, 방향키, 특수문자, Ctrl+C/V 연습 |
| `mouse` | `/mouse` | `/result/mouse` | 클릭, 더블클릭, 드래그, 바탕화면 폴더 열기, 파일 이동, 여러 개 선택 |
| `browser` | `/browser` | `/result/browser` | 브라우저 버튼 설명, 주소 입력, 사이트 검색, 뒤로/앞으로/새로고침, 새 탭/탭 닫기 |
| `login` | `/login-practice` | `/result/login` | 학교 계정 형태의 회원가입, 안전한 비밀번호, 로그인, 로그아웃 |

## 데이터 모델과 저장소

사용자 모델은 `UserContext.tsx`의 `User` 인터페이스를 기준으로 한다.

```ts
interface User {
  id: string;
  nickname: string;
  avatar: AvatarId;
  progress: {
    keyboard: boolean;
    mouse: boolean;
    browser: boolean;
    login: boolean;
  };
  lastStudiedAt?: Record<ModuleKey, string | undefined>;
  createdAt: string;
}
```

현재 사용 중인 `localStorage` 키는 다음과 같다.

| key constant | 실제 키 | 용도 |
| --- | --- | --- |
| `users` | `digischool_users` | 전체 친구 목록 |
| `currentUser` | `digischool_current_user` | 현재 선택된 친구 |
| `muted` | `digischool_muted` | 효과음/TTS 음소거 |
| `playgroundBest` | `digischool_playground_best` | 클릭 미니게임 최고 기록 |
| `studyResults` | `digischool_study_results` | 모듈별 마지막 학습 결과 |
| `loginPracticeAccounts` | `digischool_login_practice_accounts` | 친구별 로그인 연습 계정. 평가의 Google 로그인/로그아웃 실기에서 사용 |

## 완료 처리 규칙

- 학습 모듈은 완료 시 `saveStudyResult`와 `markComplete`를 함께 호출해야 한다.
- `saveStudyResult`는 모듈별 마지막 결과만 저장한다. 여러 번 학습해도 누적 이력 배열이 아니라 마지막 결과가 덮어써진다.
- `markComplete`는 `progress[module] = true`로 변경하고 `lastStudiedAt[module]`에 현재 ISO 시간을 기록한다.
- `resetProgress`는 진행도만 `false`로 돌린다. 현재 구현에서는 `studyResults`의 과거 평가 기록까지 삭제하지 않는다.
- 결과 화면은 `user.progress` 기준으로 전체 완료 여부와 다음 모듈을 계산한다.

## 라우팅과 인증

- `/register`는 로그인 전 진입점이다.
- 로그인 상태에서 `/register`로 접근하면 `/`로 리다이렉트된다.
- `/` 이하 메인 레이아웃은 `RequireAuth`로 보호된다.
- 결과 페이지(`/result/:module`)에서는 상단/하단 내비게이션을 숨긴다.
- 알 수 없는 모듈 키가 들어오면 `/dashboard`로 되돌린다.

## UI/UX 방향

- 대상 사용자는 초등학생이므로 글자 크기와 터치 영역이 크다.
- 색상은 `src/index.css`의 Tailwind v4 `@theme` 토큰을 사용한다.
- 주요 피드백은 효과음, 팡파르, 흔들림, 진행 막대, 배지, 별점, 수료증으로 제공한다.
- `SpeakButton`과 `sound.ts`의 SpeechSynthesis로 주요 안내 문구를 읽어준다.
- `prefers-reduced-motion` 대응이 전역 CSS에 들어가 있다.
- 데스크톱은 `Navbar`, 모바일은 `BottomNav` 중심으로 탐색한다.

## 구현 시 주의할 점

- 새 학습 모듈을 추가하려면 `ModuleKey`, `MODULES`, `User.progress`, 라우팅, 결과 경로, 성장 기록 표시를 함께 갱신해야 한다.
- 진행도 저장은 현재 서버가 없으므로 새 브라우저나 시크릿 모드에서는 초기화된다.
- `UserContext`는 기본 사용자 두 명을 생성한다. 마지막 사용자 삭제는 막혀 있다.
- 모듈 완료 시간이 등급 산정 기준이다. 기준은 `src/lib/evaluation.ts`의 `TARGET_SECONDS`에 있다.
- `InternetBrowser.tsx`는 컴포넌트와 로직이 큰 편이다. 브라우저 학습을 확장할 때는 미션/프리뷰/사이트 콘텐츠를 분리하는 리팩터링을 고려한다.
- README와 metadata는 한글이 깨져 보일 수 있다. 다음 작업에서 문서 품질을 정리한다면 UTF-8 상태를 확인하고 다시 저장하는 것이 좋다.

## 다음 작업 후보

- README 한글 깨짐 여부 확인 및 최신 앱 흐름으로 재작성
- `InternetBrowser.tsx` 컴포넌트 분리
- `studyResults`를 마지막 1건이 아니라 학습 이력 배열로 확장
- `/evaluation` 결과를 사용자 성장 기록에 연결할지 정책 결정
- 모듈별 접근성 점검: 키보드 포커스, 스크린리더 라벨, 드래그 대체 조작
- 빌드 후 실제 브라우저에서 모바일/데스크톱 레이아웃 점검
