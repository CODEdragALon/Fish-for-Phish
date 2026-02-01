'use client';

import { Email } from '../../lib/types';
import { CSSProperties } from 'react';

interface EmailItemProps {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
  isMobileView: boolean;
  style?: CSSProperties;
}

export default function EmailItem({ email, isSelected, onClick, isMobileView, style }: EmailItemProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <div
      onClick={onClick}
      className={`
        animate-slide-right cursor-pointer border-b border-[var(--border)] transition-colors
        ${isSelected ? 'bg-[var(--email-selected)]' : email.isRead ? 'bg-[var(--email-read)]' : 'bg-[var(--email-unread)]'}
        ${!email.isRead && !isSelected ? 'hover:bg-[var(--surface-hover)]' : 'hover:bg-[var(--email-selected)]'}
      `}
      style={style}
    >
      <div className={`flex items-start gap-3 p-3 ${isMobileView ? 'p-2' : 'p-3'}`}>
        {/* Avatar */}
        <div className={`
          flex-shrink-0 rounded-full flex items-center justify-center text-white font-medium
          ${getAvatarColor(email.sender)}
          ${isMobileView ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}
        `}>
          {getInitials(email.sender)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`truncate ${!email.isRead ? 'font-semibold' : 'font-medium'} ${isMobileView ? 'text-sm' : ''}`}>
              {isMobileView ? email.sender.split(' ')[0] : email.sender}
            </span>
            <span className="text-xs text-[var(--muted)] flex-shrink-0">
              {formatTime(email.timestamp)}
            </span>
          </div>
          
          <div className={`truncate ${!email.isRead ? 'font-medium' : ''} ${isMobileView ? 'text-xs' : 'text-sm'}`}>
            {email.subject}
          </div>
          
          {!isMobileView && (
            <div className="text-xs text-[var(--muted)] truncate mt-1">
              {email.body.replace(/<[^>]*>/g, '').slice(0, 80)}...
            </div>
          )}

          {/* Indicators */}
          <div className="flex items-center gap-2 mt-1">
            {email.hasAttachment && (
              <span className="text-[var(--muted)]" title="Has attachment">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </span>
            )}
            {email.hasQrCode && (
              <span className="text-[var(--muted)]" title="Contains QR code">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </span>
            )}
            {email.hasCalendarInvite && (
              <span className="text-[var(--muted)]" title="Calendar invite">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            )}
            {email.isReported && (
              <span className="text-[var(--danger)]" title="Reported as phishing">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
                </svg>
              </span>
            )}
            {email.isRead && !email.isReported && (
              <span className="text-[var(--success)]" title="Marked as safe">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

