'use client';

interface StatusBarProps {
  hoveredUrl: string | null;
  actualUrl: string | null;
  isSuspicious: boolean;
}

export default function StatusBar({ hoveredUrl, actualUrl, isSuspicious }: StatusBarProps) {
  const displayUrl = actualUrl || hoveredUrl;
  
  return (
    <div className="status-bar">
      {displayUrl ? (
        <>
          <span className="text-[var(--muted)] mr-2">Link:</span>
          <span className={`status-bar-url ${isSuspicious ? 'suspicious' : ''}`}>
            {displayUrl}
          </span>
          {isSuspicious && hoveredUrl !== actualUrl && (
            <span className="ml-2 text-[var(--danger)] text-xs">
              ⚠️ URL mismatch detected!
            </span>
          )}
        </>
      ) : (
        <span className="text-[var(--muted)]">Hover over links to see their destination</span>
      )}
    </div>
  );
}

