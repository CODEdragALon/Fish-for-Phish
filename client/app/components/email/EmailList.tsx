'use client';

import { Email } from '../../lib/types';
import EmailItem from './EmailItem';

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (email: Email) => void;
  isMobileView: boolean;
}

export default function EmailList({ emails, selectedId, onSelect, isMobileView }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--muted)]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>No emails yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-y-auto ${isMobileView ? 'text-sm' : ''}`}>
      {emails.map((email, index) => (
        <EmailItem
          key={email.id}
          email={email}
          isSelected={selectedId === email.id}
          onClick={() => onSelect(email)}
          isMobileView={isMobileView}
          style={{ animationDelay: `${index * 0.05}s` }}
        />
      ))}
    </div>
  );
}

