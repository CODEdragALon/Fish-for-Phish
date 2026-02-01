'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSession, saveSessionId, getStoredSessionId, getSession, clearStoredSession } from './lib/api';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Initialize theme from localStorage and check for existing session
  useEffect(() => {
    const sessionId = getStoredSessionId();
    setHasExistingSession(!!sessionId);
    
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleStartNew = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { sessionId } = await createSession();
      saveSessionId(sessionId);
      router.push('/inbox');
    } catch (err) {
      setError('Failed to start simulation. Please ensure the server is running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    const sessionId = getStoredSessionId();
    if (!sessionId) {
      handleStartNew();
      return;
    }
    
    setIsLoading(true);
    try {
      const session = await getSession(sessionId);
      if (session.isCompleted) {
        clearStoredSession();
        handleStartNew();
      } else {
        router.push('/inbox');
      }
    } catch {
      clearStoredSession();
      handleStartNew();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          {/* Logo and Title */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] mb-6">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--foreground)] via-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
              Fish for Phish
            </h1>
            <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
              As AI-powered phishing attacks become more sophisticated, learning to spot them is crucial. 
              Train your eye with realistic email simulations.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={handleStartNew}
              disabled={isLoading}
              className="btn btn-primary text-lg px-8 py-4 w-full sm:w-auto"
            >
              {isLoading ? (
                <span className="animate-pulse">Starting...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start New Simulation
                </>
              )}
            </button>
            
            {hasExistingSession && (
              <button
                onClick={handleContinue}
                disabled={isLoading}
                className="btn btn-ghost text-lg px-8 py-4 w-full sm:w-auto"
              >
                Continue Previous Session
              </button>
            )}
          </div>

          {error && (
            <div className="mt-6 text-center text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-lg p-4">
              {error}
            </div>
          )}

          {/* How it works */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-semibold mb-8">How It Works</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold">1</div>
                <span className="text-[var(--muted)]">Review emails in your inbox</span>
              </div>
              <svg className="hidden md:block w-8 h-8 text-[var(--border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold">2</div>
                <span className="text-[var(--muted)]">Report suspicious emails</span>
              </div>
              <svg className="hidden md:block w-8 h-8 text-[var(--border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold">3</div>
                <span className="text-[var(--muted)]">Learn from feedback</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-6 text-center text-[var(--muted)] text-sm">
        <p>Fish for Phish - Educational Phishing Awareness Training</p>
      </footer>
    </div>
  );
}
