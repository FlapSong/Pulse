import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Pulse React component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#09090B] text-[#F5F5F7] flex flex-col items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-[#111113] border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {this.props.fallbackTitle || 'Произошел сбой компонента'}
              </h2>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Мы предотвратили появления белого экрана. Вы можете моментально перезагрузить интерфейс и продолжить общаться.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-2xl bg-[#09090B] border border-white/[0.06] text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl bg-[#22D3EE] hover:bg-[#06b6d4] text-[#09090B] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Перезагрузить</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
