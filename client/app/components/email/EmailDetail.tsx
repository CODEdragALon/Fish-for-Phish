'use client';

import { Email, EmailLink } from '../../lib/types';

interface EmailDetailProps {
  email: Email;
  isMobileView: boolean;
  onLinkHover: (link: EmailLink | null) => void;
  onLinkClick: (link: EmailLink) => void;
  onReport: () => void;
  onMarkSafe: () => void;
  isProcessed: boolean;
}

export default function EmailDetail({ 
  email, 
  isMobileView, 
  onLinkHover, 
  onLinkClick,
  onReport, 
  onMarkSafe,
  isProcessed 
}: EmailDetailProps) {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Process body to add hover handlers to links
  const processBody = (html: string) => {
    if (!email.links || email.links.length === 0) return html;
    
    let processed = html;
    email.links.forEach((link, index) => {
      // Replace anchor tags with data attributes for our hover handler
      const pattern = new RegExp(`<a[^>]*href="[^"]*"[^>]*>${link.displayText}</a>`, 'gi');
      processed = processed.replace(pattern, 
        `<a href="#" data-link-index="${index}" class="email-link" onclick="return false;">${link.displayText}</a>`
      );
    });
    return processed;
  };

  const handleMouseOver = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && target.dataset.linkIndex !== undefined) {
      const index = parseInt(target.dataset.linkIndex);
      if (email.links && email.links[index]) {
        onLinkHover(email.links[index]);
      }
    }
  };

  const handleMouseOut = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      onLinkHover(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && target.dataset.linkIndex !== undefined) {
      e.preventDefault();
      const index = parseInt(target.dataset.linkIndex);
      if (email.links && email.links[index]) {
        onLinkClick(email.links[index]);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--background)]">
      <div className={`${isMobileView ? 'p-3' : 'p-6'} animate-fade-in`}>
        {/* Email Header */}
        <div className="mb-6">
          <h1 className={`font-semibold mb-4 ${isMobileView ? 'text-lg' : 'text-2xl'}`}>
            {email.subject}
          </h1>
          
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-medium flex-shrink-0">
              {email.sender.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-semibold">{email.sender}</span>
                <span className={`text-[var(--muted)] ${isMobileView ? 'text-xs' : 'text-sm'}`}>
                  &lt;{email.senderEmail}&gt;
                </span>
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">
                {formatDate(email.timestamp)}
              </div>
            </div>
          </div>
        </div>

        {/* Threaded Emails (for clone phishing) */}
        {email.isThreaded && email.threadEmails && email.threadEmails.length > 0 && (
          <div className="mb-6 border-l-2 border-[var(--border)] pl-4 space-y-4">
            <div className="text-xs text-[var(--muted)] mb-2">Previous messages in thread:</div>
            {email.threadEmails.map((thread, index) => (
              <div key={index} className="bg-[var(--surface)] rounded-lg p-4 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{thread.sender}</span>
                  <span className="text-xs text-[var(--muted)]">&lt;{thread.senderEmail}&gt;</span>
                </div>
                <div className="text-[var(--muted)]" dangerouslySetInnerHTML={{ __html: thread.body }} />
              </div>
            ))}
            <div className="text-xs text-[var(--muted)] border-t border-[var(--border)] pt-2">
              Latest reply:
            </div>
          </div>
        )}

        {/* Email Body */}
        <div 
          className={`email-body ${isMobileView ? 'text-sm' : ''}`}
          dangerouslySetInnerHTML={{ __html: processBody(email.body) }}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          onClick={handleClick}
        />

        {/* QR Code Display */}
        {email.hasQrCode && email.qrCodeUrl && (
          <div className="mt-6 p-4 bg-[var(--surface)] rounded-lg">
            <div className="text-sm text-[var(--muted)] mb-2">QR Code:</div>
            <div className="qr-code-display">
              <div className="text-center">
                <svg className="w-24 h-24 mx-auto mb-2" viewBox="0 0 100 100">
                  {/* Simplified QR code representation */}
                  <rect width="100" height="100" fill="white"/>
                  <rect x="10" y="10" width="25" height="25" fill="black"/>
                  <rect x="65" y="10" width="25" height="25" fill="black"/>
                  <rect x="10" y="65" width="25" height="25" fill="black"/>
                  <rect x="15" y="15" width="15" height="15" fill="white"/>
                  <rect x="70" y="15" width="15" height="15" fill="white"/>
                  <rect x="15" y="70" width="15" height="15" fill="white"/>
                  <rect x="20" y="20" width="5" height="5" fill="black"/>
                  <rect x="75" y="20" width="5" height="5" fill="black"/>
                  <rect x="20" y="75" width="5" height="5" fill="black"/>
                  {/* Random pattern */}
                  <rect x="45" y="10" width="5" height="5" fill="black"/>
                  <rect x="45" y="20" width="5" height="5" fill="black"/>
                  <rect x="45" y="45" width="10" height="10" fill="black"/>
                  <rect x="10" y="45" width="5" height="5" fill="black"/>
                  <rect x="20" y="45" width="5" height="5" fill="black"/>
                  <rect x="55" y="45" width="5" height="5" fill="black"/>
                  <rect x="65" y="55" width="5" height="5" fill="black"/>
                  <rect x="80" y="55" width="5" height="5" fill="black"/>
                  <rect x="55" y="75" width="5" height="5" fill="black"/>
                  <rect x="75" y="85" width="5" height="5" fill="black"/>
                </svg>
                <span 
                  className="text-xs text-[var(--danger)] cursor-help"
                  title={`Links to: ${email.qrCodeUrl}`}
                  onMouseEnter={() => onLinkHover({ 
                    displayText: 'QR Code', 
                    displayUrl: 'Scan to view', 
                    actualUrl: email.qrCodeUrl!, 
                    isSuspicious: true 
                  })}
                  onMouseLeave={() => onLinkHover(null)}
                >
                  Hover to see destination
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Invite */}
        {email.hasCalendarInvite && email.calendarDetails && (
          <div className="mt-6 p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold">Calendar Invite</span>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-[var(--muted)]">Title:</span> {email.calendarDetails.title}</div>
              <div><span className="text-[var(--muted)]">Date:</span> {email.calendarDetails.date}</div>
              <div><span className="text-[var(--muted)]">Time:</span> {email.calendarDetails.time}</div>
              <div><span className="text-[var(--muted)]">Location:</span> {email.calendarDetails.location}</div>
              <div><span className="text-[var(--muted)]">Organizer:</span> {email.calendarDetails.organizer}</div>
              {email.calendarDetails.meetingLink && (
                <div 
                  onMouseEnter={() => onLinkHover({ 
                    displayText: 'Join Meeting', 
                    displayUrl: email.calendarDetails!.meetingLink!, 
                    actualUrl: email.calendarDetails!.meetingLink!, 
                    isSuspicious: true 
                  })}
                  onMouseLeave={() => onLinkHover(null)}
                >
                  <span className="text-[var(--muted)]">Meeting Link:</span>{' '}
                  <a href="#" className="text-[var(--primary)] hover:underline" onClick={(e) => e.preventDefault()}>
                    {email.calendarDetails.meetingLink}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attachment */}
        {email.hasAttachment && email.attachmentName && (
          <div className="mt-6 p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)] inline-flex items-center gap-3">
            <svg className="w-8 h-8 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <div className="text-sm font-medium">{email.attachmentName}</div>
              <div className="text-xs text-[var(--muted)]">Click to download (simulated)</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isProcessed && (
          <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-[var(--border)]">
            <button
              onClick={onReport}
              className="btn btn-danger"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Report
            </button>
            <button
              onClick={onMarkSafe}
              className="btn btn-ghost"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark as Safe
            </button>
          </div>
        )}

        {isProcessed && (
          <div className="mt-8 p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)] text-center text-[var(--muted)]">
            You have already reviewed this email.
          </div>
        )}
      </div>
    </div>
  );
}


