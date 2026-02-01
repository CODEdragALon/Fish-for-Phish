'use client';

interface MobileToggleProps {
  isMobile: boolean;
  onToggle: () => void;
}

export default function MobileToggle({ isMobile, onToggle }: MobileToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
      <button
        onClick={() => isMobile && onToggle()}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
          !isMobile 
            ? 'bg-[var(--primary)] text-white' 
            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
        }`}
        title="Desktop view"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="hidden sm:inline">Desktop</span>
      </button>
      <button
        onClick={() => !isMobile && onToggle()}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
          isMobile 
            ? 'bg-[var(--primary)] text-white' 
            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
        }`}
        title="Mobile view - See how phishing looks on mobile devices"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="hidden sm:inline">Mobile</span>
      </button>
    </div>
  );
}

