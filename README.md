# 디지 스쿨 (Digi School)

초등학생을 위한 디지털 리터러시 학습 앱이에요. 키보드, 타자, 마우스, 인터넷 브라우저, 로그인/로그아웃을 게임처럼 즐겁게 익힐 수 있어요.

## 주요 기능

- **친구 만들기**: 닉네임과 아바타를 골라 나만의 학습 친구를 만들어요. 여러 명을 등록해 가족이나 반 친구들과 함께 사용할 수 있어요.
- **5가지 학습 모듈**
  - 키보드 학습: Enter, Space, Backspace, Shift, Ctrl/Alt/Tab, 방향키, 특수문자, Ctrl+C/V를 익혀요.
  - 자판/타자 학습: 한글과 영어 자판 위치를 외우고 낱말부터 긴 글까지 타자를 연습해요.
  - 마우스 연습: 풍선 클릭, 상자 더블클릭, 장난감 드래그앤드롭을 한 화면에서!
  - 인터넷 브라우저: 가상 주소창에 `naver.com`, `google.com`, `youtube.com` 등을 입력해 사이트를 탐색해요.
  - 로그인/로그아웃: 안전한 비밀번호 퀴즈와 로그아웃 습관을 함께 배워요.
- **진행도 추적**: 모듈을 완료하면 별, 배지, 수료증을 받아요. 모든 모듈을 끝내면 디지 스쿨 마스터 증서가 발급돼요.
- **연습장 & 성장기록**: 자유 연습용 미니 게임과 학습 기록을 한눈에 확인할 수 있어요.
- **어린이 친화적 UX**: 큰 글자, 효과음, 음성 안내(읽어주기), 컨페티 애니메이션, 음소거 토글, 키보드 포커스 가시화.

## 기술 스택

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router v7
- Motion (애니메이션)
- 데이터는 모두 브라우저 LocalStorage에 저장 — 서버 없이 동작해요.

## 실행하기

필요 환경: Node.js 18 이상.

```bash
npm install
npm run dev      # http://localhost:3000
```

## 프로젝트 구조

```
src/
├── App.tsx                  # 라우팅 + ErrorBoundary + 인증 가드
├── main.tsx
├── index.css                # Tailwind 토큰, 전역 포커스 스타일
├── components/
│   ├── ErrorBoundary.tsx
│   ├── MuteFab.tsx          # 모바일용 음소거 토글
│   ├── SpeakButton.tsx      # 텍스트 읽어주기 버튼
│   └── layout/
│       ├── Layout.tsx
│       ├── Navbar.tsx       # 데스크톱 상단 메뉴 + 음소거/로그아웃
│       └── BottomNav.tsx    # 모바일 하단 메뉴
├── context/
│   └── UserContext.tsx      # 사용자 등록/선택/진행도/삭제
├── lib/
│   ├── constants.ts         # 모듈 메타데이터, LocalStorage 키
│   ├── sound.ts             # Web Audio 효과음 + SpeechSynthesis
│   └── utils.ts             # cn (clsx + tailwind-merge)
└── pages/
    ├── Registration.tsx     # 친구 선택/추가/삭제
    ├── Home.tsx
    ├── Dashboard.tsx        # 학습 모듈 카드
    ├── KeyboardPractice.tsx
    ├── MousePractice.tsx
    ├── InternetBrowser.tsx
    ├── LoginPractice.tsx
    ├── Result.tsx           # 모듈별 + 마스터 증서
    ├── Growth.tsx           # 성장 기록
    ├── Playground.tsx       # 연습장 + 미니 게임
    └── NotFound.tsx
```

## 빌드 & 검증

```bash
npm run lint     # tsc --noEmit
npm run build
npm run preview
```
