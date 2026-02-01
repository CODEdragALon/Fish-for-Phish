'use client';

import { useEffect, useState } from 'react';

interface FeedbackToastProps {
  isVisible: boolean;
  isCorrect: boolean;
  pointsEarned: number;
  wasPhishing: boolean;
  onClose: () => void;
}

export default function FeedbackToast({ 
  isVisible, 
  isCorrect, 
  pointsEarned, 
  wasPhishing,
  onClose 
}: FeedbackToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible && !show) return null;

  // Simple feedback message
  const getMessage = () => {
    if (isCorrect) {
      return wasPhishing 
        ? 'You correctly identified this phishing email!' 
        : 'You correctly identified this as legitimate.';
    } else {
      return wasPhishing 
        ? 'This was actually a phishing email.' 
        : 'This was actually a legitimate email.';
    }
  };

  return (
    <div 
      className={`fixed bottom-8 right-8 z-50 transition-all duration-300 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className={`rounded-xl p-4 shadow-2xl border backdrop-blur-sm ${
        isCorrect 
          ? 'bg-[var(--success)]/10 border-[var(--success)]' 
          : 'bg-[var(--danger)]/10 border-[var(--danger)]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isCorrect ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
          }`}>
            {isCorrect ? (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${isCorrect ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
              <span className={`font-mono font-bold text-sm ${pointsEarned >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {pointsEarned >= 0 ? '+' : ''}{pointsEarned} pts
              </span>
            </div>
            <p className="text-sm text-[var(--muted)]">{getMessage()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
