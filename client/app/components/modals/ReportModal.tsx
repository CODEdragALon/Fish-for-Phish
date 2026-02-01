'use client';

import { useState } from 'react';
import { PHISHING_INDICATORS, INDICATOR_LABELS, PhishingIndicator } from '../../lib/types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportedAsPhishing: boolean, reasons: PhishingIndicator[]) => void;
  emailSubject: string;
  isLoading: boolean;
}

export default function ReportModal({ isOpen, onClose, onSubmit, emailSubject, isLoading }: ReportModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<PhishingIndicator[]>([]);

  if (!isOpen) return null;

  const handleReasonToggle = (reason: PhishingIndicator) => {
    setSelectedReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = () => {
    onSubmit(true, selectedReasons);
    // Reset state
    setSelectedReasons([]);
  };

  const handleClose = () => {
    setSelectedReasons([]);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--danger)]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Report as Phishing</h2>
                <p className="text-sm text-[var(--muted)] truncate max-w-xs">{emailSubject}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Reasons Checklist */}
          <div>
            <h3 className="font-medium mb-3">Why do you think it&apos;s phishing?</h3>
            <p className="text-sm text-[var(--muted)] mb-4">
              Select all indicators you noticed (optional but earns bonus points)
            </p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {PHISHING_INDICATORS.map(indicator => (
                <label 
                  key={indicator}
                  className="checkbox-container"
                >
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(indicator)}
                    onChange={() => handleReasonToggle(indicator)}
                  />
                  <span>{INDICATOR_LABELS[indicator]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="btn btn-ghost"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn btn-danger"
          >
            {isLoading ? (
              <span className="animate-pulse">Submitting...</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Report as Phishing
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

