import React from 'react';
import usePWAInstall from '../hooks/usePWAInstall';

export default function InstallPrompt() {
  const { canInstall, install, dismiss, dismissed } = usePWAInstall();

  if (!canInstall || dismissed) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-slide-up">
      <div className="glass rounded-lg shadow-glass-lg p-5 border border-brand-200/30">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-brand-600 rounded-lg flex items-center justify-center shadow-brand">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-surface-900">Install Smart Xerox</h3>
            <p className="text-xs text-surface-500 mt-1">
              Add to your home screen for quick access and offline support.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={install}
                className="px-4 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg shadow-brand hover:bg-brand-700 transition-all duration-200"
              >
                Install
              </button>
              <button
                onClick={dismiss}
                className="px-4 py-1.5 text-xs font-medium text-surface-500 hover:text-surface-700 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
