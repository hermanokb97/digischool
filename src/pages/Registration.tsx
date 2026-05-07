import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarId, useUser } from '@/context/UserContext';
import { GUEST_PROFILE_IMAGE_SRC } from '@/lib/constants';
import { playClick, playFail, playSuccess } from '@/lib/sound';

interface AvatarOption {
  id: AvatarId;
  emoji: string;
  label: string;
  bg: string;
  shadow: string;
}

const AVATARS: AvatarOption[] = [
  { id: 'bear', emoji: '🐻', label: '곰', bg: 'bg-secondary-fixed', shadow: 'shadow-[0_8px_0_0_#95d5a7]' },
  { id: 'robot', emoji: '🤖', label: '로봇', bg: 'bg-tertiary-fixed', shadow: 'shadow-[0_8px_0_0_#dcc66e]' },
  { id: 'cat', emoji: '🐱', label: '고양이', bg: 'bg-primary-fixed', shadow: 'shadow-[0_8px_0_0_#90cdff]' },
  { id: 'dino', emoji: '🦖', label: '공룡', bg: 'bg-error-container', shadow: 'shadow-[0_8px_0_0_#ffdad6]' },
  { id: 'unicorn', emoji: '🦄', label: '유니콘', bg: 'bg-tertiary-container', shadow: 'shadow-[0_8px_0_0_#ceb962]' },
  { id: 'fox', emoji: '🦊', label: '여우', bg: 'bg-secondary-container', shadow: 'shadow-[0_8px_0_0_#aeefbf]' },
];

function getAvatarOption(id: AvatarId | string | undefined): AvatarOption {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export function Registration() {
  const [newNickname, setNewNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>('bear');
  const [isAdding, setIsAdding] = useState(false);
  const [guestPromptVisible, setGuestPromptVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { users, login, register, enterAsGuest, removeUser, isNicknameTaken } = useUser();
  const navigate = useNavigate();

  const trimmed = newNickname.trim();
  const validation = useMemo<string | null>(() => {
    if (!trimmed) return null;
    if (trimmed.length < 2) return '두 글자 이상 적어주세요.';
    if (trimmed.length > 10) return '10글자 이하로 적어주세요.';
    if (isNicknameTaken(trimmed)) return '이미 있는 이름이에요. 다른 이름을 골라 보세요.';
    return null;
  }, [trimmed, isNicknameTaken]);

  const handleLogin = (id: string) => {
    if (editMode) return;
    playClick();
    login(id);
    navigate('/');
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed) {
      setError('이름을 입력해 주세요.');
      playFail();
      return;
    }
    if (validation) {
      setError(validation);
      playFail();
      return;
    }
    register(trimmed, selectedAvatar);
    playSuccess();
    navigate('/');
  };

  const handleOpenAddFriend = () => {
    playClick();
    setIsAdding(true);
    setNewNickname('');
    setSelectedAvatar('bear');
    setError(null);
  };

  const handleCloseAddFriend = () => {
    playClick();
    setIsAdding(false);
    setNewNickname('');
    setSelectedAvatar('bear');
    setError(null);
  };

  const handleOpenGuestPrompt = () => {
    playClick();
    setGuestPromptVisible(true);
  };

  const handleCloseGuestPrompt = () => {
    playClick();
    setGuestPromptVisible(false);
  };

  const handleEnterGuest = () => {
    playSuccess();
    enterAsGuest();
    navigate('/');
  };

  const handleRemove = (id: string, nickname: string) => {
    if (users.length <= 1) {
      alert('마지막 한 명은 삭제할 수 없어요.');
      return;
    }
    if (confirm(`${nickname}님을 정말 삭제할까요? 학습 기록도 함께 사라져요.`)) {
      removeUser(id);
      playClick();
    }
  };

  return (
    <div className="bg-background min-h-screen flex flex-col pt-24 pb-12">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-10 py-5 bg-white/90 backdrop-blur-md rounded-b-[40px] border-b-4 border-surface-container-high shadow-xl shadow-surface-container/50">
        <div className="flex items-center">
          <img src="/digischool-icon.png" alt="디지 스쿨 아이콘" className="w-11 h-11 rounded-2xl object-cover mr-3" />
          <span className="text-2xl font-black text-primary font-lexend tracking-tight">디지 스쿨</span>
        </div>
        <nav className="hidden md:flex items-center gap-8" aria-label="안내">
          <span className="font-lexend font-bold tracking-tight text-on-surface-variant">친구를 만들거나 손님으로 먼저 둘러보세요</span>
        </nav>
        {users.length > 0 ? (
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className={`px-5 py-2 rounded-full font-label-bold text-label-bold border-2 transition-colors ${
              editMode
                ? 'bg-error text-on-error border-error'
                : 'bg-surface-container-lowest text-primary border-primary-container hover:bg-primary-container'
            }`}
            aria-pressed={editMode}
          >
            {editMode ? '편집 끝' : '편집'}
          </button>
        ) : (
          <div className="w-[80px]" aria-hidden="true" />
        )}
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-margin-mobile md:px-margin-tablet py-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h1 className="font-display-lg text-display-lg text-on-surface mb-4">누가 학습할까요?</h1>
          <p className="font-body-xl text-body-xl text-on-surface-variant">새 친구를 만들거나 손님으로 바로 체험해요.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl items-stretch">
          <button
            type="button"
            onClick={handleOpenAddFriend}
            className="group bg-surface-container-low rounded-[3rem] p-8 flex flex-col items-center justify-center gap-6 border-4 border-dashed border-outline-variant hover:border-primary transition-all duration-300 transform hover:scale-[1.02] active:scale-95 active:translate-y-2 h-full min-h-[340px]"
          >
            <div className="w-32 h-32 rounded-full bg-surface-variant flex items-center justify-center mb-2 group-hover:bg-primary-fixed transition-colors">
              <span className="material-symbols-outlined text-6xl text-primary font-bold">add</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary">새 친구 추가</h2>
            <div className="text-on-surface-variant font-label-bold text-label-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              클릭해서 만들기
            </div>
          </button>

          <button
            type="button"
            onClick={handleOpenGuestPrompt}
            className="group bg-surface-container-lowest rounded-[3rem] p-8 flex flex-col items-center justify-center gap-6 border-2 border-secondary-container hover:border-secondary transition-all duration-300 transform hover:scale-[1.02] active:scale-95 active:translate-y-2 h-full min-h-[340px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <div className="w-32 h-32 rounded-full bg-secondary-container flex items-center justify-center mb-2 shadow-[0_8px_0_0_#95d5a7] group-active:shadow-none group-active:translate-y-2 transition-all overflow-hidden">
              <img
                src={GUEST_PROFILE_IMAGE_SRC}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
              />
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface">손님으로 입장하기</h2>
            <div className="text-on-surface-variant font-label-bold text-label-bold mt-2 text-center">
              저장 없이 둘러보기
            </div>
          </button>

          {users.map((u) => {
            const av = getAvatarOption(u.avatar);
            return (
              <div key={u.id} className="relative">
                <button
                  onClick={() => handleLogin(u.id)}
                  className="group bg-surface-container-lowest rounded-[3rem] p-8 flex flex-col items-center justify-start gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(112,193,255,0.2)] border-2 border-transparent hover:border-primary-container transition-all duration-300 transform hover:scale-[1.02] active:scale-95 active:translate-y-2 relative overflow-hidden text-center h-full min-h-[340px] w-full"
                  aria-label={`${u.nickname}으로 시작`}
                >
                  <div className={`w-32 h-32 rounded-full ${av.bg} flex items-center justify-center mb-2 ${av.shadow} group-active:shadow-none group-active:translate-y-2 transition-all flex-shrink-0 mt-4 text-7xl`}>
                    <span aria-hidden="true">{av.emoji}</span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface truncate w-full px-2">{u.nickname}</h2>
                  <div className="mt-auto bg-primary-container text-on-primary-container px-8 py-3 rounded-full font-label-bold text-label-bold shadow-[0_4px_0_0_#006496] group-hover:bg-primary group-hover:text-on-primary transition-colors flex-shrink-0">
                    선택하기
                  </div>
                </button>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => handleRemove(u.id, u.nickname)}
                    disabled={users.length <= 1}
                    className="absolute top-4 right-4 w-12 h-12 rounded-full bg-error text-on-error shadow-md flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={`${u.nickname} 삭제`}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {isAdding && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-scrim/50 px-4 py-8 backdrop-blur-sm">
            <form
              onSubmit={handleRegister}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-friend-title"
              className="relative w-full max-w-[520px] max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[3rem] border-4 border-primary bg-surface-container-lowest p-8 shadow-[0_24px_80px_rgb(0,0,0,0.22)]"
              noValidate
            >
              <button
                type="button"
                onClick={handleCloseAddFriend}
                className="absolute top-6 right-6 text-outline hover:text-error transition-colors p-2 rounded-full hover:bg-error-container"
                aria-label="닫기"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="flex flex-col items-center gap-5">
                <div>
                  <p className="font-label-bold text-label-bold text-primary text-center mb-2">새 프로필</p>
                  <h2 id="add-friend-title" className="font-headline-lg text-headline-lg text-on-surface text-center">
                    새 친구 추가
                  </h2>
                </div>

                <div className={`w-28 h-28 rounded-full ${getAvatarOption(selectedAvatar).bg} flex items-center justify-center ${getAvatarOption(selectedAvatar).shadow} mb-1 flex-shrink-0 text-6xl`}>
                  <span aria-hidden="true">{getAvatarOption(selectedAvatar).emoji}</span>
                </div>

                <fieldset className="w-full">
                  <legend className="font-label-bold text-label-bold text-on-surface mb-3 text-center">아바타를 골라보세요</legend>
                  <div className="flex flex-wrap justify-center gap-3">
                    {AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          playClick();
                          setSelectedAvatar(av.id);
                        }}
                        aria-label={`아바타 ${av.label}`}
                        aria-pressed={selectedAvatar === av.id}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all ${av.bg} ${
                          selectedAvatar === av.id
                            ? 'ring-4 ring-primary scale-110'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                      >
                        <span aria-hidden="true">{av.emoji}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="w-full">
                  <span className="block font-label-bold text-label-bold text-on-surface mb-2 text-center">친구 이름</span>
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => {
                      setNewNickname(e.target.value);
                      setError(null);
                    }}
                    placeholder="친구 이름 (2~10자)"
                    className="w-full h-14 rounded-xl border-2 border-primary focus:ring-4 focus:ring-primary-fixed px-4 font-headline-md text-headline-md text-center bg-surface transition-colors placeholder-outline-variant outline-none"
                    autoFocus
                    maxLength={10}
                    aria-label="닉네임"
                  />
                </label>

                {(error || validation) && (
                  <p role="alert" className="font-label-bold text-label-bold text-error text-center">
                    {error || validation}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={handleCloseAddFriend}
                    className="h-14 rounded-xl border-2 border-outline-variant bg-surface-container text-on-surface font-label-bold text-label-bold hover:bg-surface-container-high transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={!trimmed || !!validation}
                    className="h-14 bg-primary text-on-primary font-label-bold text-label-bold rounded-xl shadow-[0_4px_0_rgb(0,78,118)] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0 disabled:cursor-not-allowed"
                  >
                    추가하기
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {guestPromptVisible && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-scrim/50 px-4 py-8 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-entry-title"
          >
            <div className="relative w-full max-w-[520px] rounded-[2rem] border-4 border-secondary bg-surface-container-lowest p-8 shadow-[0_24px_80px_rgb(0,0,0,0.22)]">
              <button
                type="button"
                onClick={handleCloseGuestPrompt}
                className="absolute top-5 right-5 text-outline hover:text-error transition-colors p-2 rounded-full hover:bg-error-container"
                aria-label="닫기"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="flex flex-col items-center gap-5 text-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-secondary-container shadow-[0_6px_0_0_#95d5a7]">
                  <img
                    src={GUEST_PROFILE_IMAGE_SRC}
                    alt="손님 프로필 사진"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-secondary mb-2">손님 모드</p>
                  <h2 id="guest-entry-title" className="font-headline-lg text-headline-lg text-on-surface">
                    손님으로 입장할까요?
                  </h2>
                </div>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  손님으로 들어가면 학습 완료, 평가 시간, 연습장에서 만든 기록 정보는 저장되지 않아요.
                  그래도 모든 콘텐츠는 바로 체험할 수 있어요.
                </p>
                <div className="w-full rounded-xl bg-tertiary-container px-5 py-4 text-on-tertiary-container">
                  <p className="font-label-bold text-label-bold">기록을 남기고 싶다면 새 친구를 먼저 만들어 주세요.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={handleCloseGuestPrompt}
                    className="h-14 rounded-xl border-2 border-outline-variant bg-surface-container text-on-surface font-label-bold text-label-bold hover:bg-surface-container-high transition-colors"
                  >
                    돌아가기
                  </button>
                  <button
                    type="button"
                    onClick={handleEnterGuest}
                    className="h-14 rounded-xl bg-secondary text-on-secondary font-label-bold text-label-bold shadow-[0_4px_0_rgba(0,33,14,0.4)] active:shadow-none active:translate-y-[4px] transition-all"
                  >
                    그래도 입장하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-12 px-10 flex flex-col md:flex-row justify-between items-center gap-6 bg-surface-container-lowest rounded-t-[40px] border-t-2 border-surface-container-high mt-auto">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <span className="font-lexend font-black text-primary text-xl">디지 스쿨</span>
          <span className="font-lexend text-sm font-medium text-on-surface-variant">© {new Date().getFullYear()} 디지 스쿨. 즐거운 디지털 배움터.</span>
        </div>
        <span className="font-lexend text-sm font-medium text-on-surface-variant">초등학생을 위한 디지털 리터러시 학습 앱</span>
      </footer>
    </div>
  );
}
