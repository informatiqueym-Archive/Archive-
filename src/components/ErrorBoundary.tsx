import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    const { handleReset } = this;
    if (this.state.hasError) {
      let message = "An unexpected error occurred.";
      let details = "";

      try {
        // Check if it's our JSON firestore error
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            message = `Archive Access Error: ${parsed.operationType.toUpperCase()} operation failed.`;
            details = parsed.error;
          }
        }
      } catch (e) {
        // Not a JSON error, use default
        message = this.state.error?.message || message;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-red-100 text-center">
            <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-2xl mb-6">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">System Error</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">{message}</p>
            
            {details && (
              <div className="bg-slate-50 p-4 rounded-xl text-left mb-8 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical Details</p>
                <p className="text-xs font-mono text-slate-500 break-all">{details}</p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
