import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background text-center gap-6">
          <div className="w-32 h-32 bg-error-container rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
              sentiment_dissatisfied
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-background">앗, 문제가 생겼어요!</h1>
          <p className="font-body-xl text-body-xl text-on-surface-variant max-w-md">
            잠시 쉬었다가 다시 시도해 봐요. 홈으로 돌아가서 새로 시작할 수 있어요.
          </p>
          <button
            onClick={this.handleReset}
            className="bg-primary text-on-primary font-label-bold text-label-bold px-8 py-4 rounded-full shadow-[0_4px_0_rgb(0,78,118)] active:shadow-none active:translate-y-1 transition-all"
          >
            홈으로 가기
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
