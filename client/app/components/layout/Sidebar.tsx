'use client';

interface SidebarProps {
  currentDay: number;
  score: number;
  emailsRemaining: number;
  onShowQA: () => void;
  allEmailsReviewed?: boolean;
  onContinueDay?: () => void;
  isAdvancing?: boolean;
}

export default function Sidebar({ currentDay, score, emailsRemaining, onShowQA, allEmailsReviewed, onContinueDay, isAdvancing }: SidebarProps) {
  return (
    <aside className="w-64 bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-sm">Fish for Phish</h1>
          </div>
        </div>
      </div>

      {/* Folder Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <span className="font-medium">Inbox</span>
            {emailsRemaining > 0 && (
              <span className="ml-auto bg-[var(--primary)] text-white text-xs px-2 py-0.5 rounded-full">
                {emailsRemaining}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Day Progress */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--muted)]">Day Progress</span>
            <span className="text-xs font-medium">{currentDay}/7</span>
          </div>
          <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-500"
              style={{ width: `${(currentDay / 7) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Score Display */}
        <div className="bg-[var(--surface)] rounded-lg p-3">
          <div className="text-xs text-[var(--muted)] mb-1">Reputation Score</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{score.toLocaleString()}</span>
            <span className="text-xs text-[var(--muted)]">pts</span>
          </div>
        </div>
      </div>

      {/* Help Button */}
      <div className="p-4 border-t border-[var(--border)]">
        <button
          onClick={onShowQA}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--warning)]/10 text-[var(--warning)] hover:bg-[var(--warning)]/20 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="font-medium text-sm">Learn & Tips</span>
        </button>

        {/* Continue to Next Day Button - Shows when all emails are reviewed */}
        {allEmailsReviewed && onContinueDay && (
          <button
            onClick={onContinueDay}
            disabled={isAdvancing}
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-[var(--success)] text-white hover:bg-[var(--success)]/90 transition-colors disabled:opacity-50"
          >
            {isAdvancing ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="font-medium text-sm">
                  {currentDay >= 7 ? 'View Final Results' : 'Continue to Next Day'}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}

