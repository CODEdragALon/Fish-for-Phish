'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/layout/Sidebar';
import StatusBar from '../components/layout/StatusBar';
import EmailList from '../components/email/EmailList';
import EmailDetail from '../components/email/EmailDetail';
import ReportModal from '../components/modals/ReportModal';
import QAPanel from '../components/modals/QAPanel';
import DailySummary from '../components/modals/DailySummary';
import MobileToggle from '../components/ui/MobileToggle';
import FeedbackToast from '../components/ui/FeedbackToast';
import {
  getStoredSessionId,
  getSession,
  getEmailsForDay,
  submitResponse,
  getDailySummary,
  advanceDay,
  clearStoredSession,
  createSession,
  saveSessionId
} from '../lib/api';
import type { 
  Session, 
  Email, 
  EmailLink, 
  DailySummary as DailySummaryType,
  PhishingIndicator,
  SubmitResponseResult
} from '../lib/types';

export default function InboxPage() {
  const router = useRouter();
  
  // Core state
  const [session, setSession] = useState<Session | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isMobileView, setIsMobileView] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<EmailLink | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showQAPanel, setShowQAPanel] = useState(false);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [dailySummary, setDailySummary] = useState<DailySummaryType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Feedback toast state
  const [feedbackToast, setFeedbackToast] = useState<{
    isVisible: boolean;
    isCorrect: boolean;
    pointsEarned: number;
    wasPhishing: boolean;
  }>({ isVisible: false, isCorrect: false, pointsEarned: 0, wasPhishing: false });

  // Initialize theme from localStorage
  useEffect(() => {
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

  // Load session and emails
  const loadData = useCallback(async () => {
    const sessionId = getStoredSessionId();
    if (!sessionId) {
      router.push('/');
      return;
    }

    try {
      setIsLoading(true);
      const sessionData = await getSession(sessionId);
      setSession(sessionData);

      const emailsData = await getEmailsForDay(sessionId, sessionData.currentDay);
      setEmails(emailsData);

      // Check if all emails reviewed - show summary
      if (sessionData.allEmailsReviewed) {
        const summary = await getDailySummary(sessionId, sessionData.currentDay);
        setDailySummary(summary);
        setShowDailySummary(true);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      setError('Failed to load session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle email selection
  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
  };

  // Handle link hover
  const handleLinkHover = (link: EmailLink | null) => {
    setHoveredLink(link);
  };

  // Handle link click - deduct points for clicking malicious links
  const handleLinkClick = (link: EmailLink) => {
    if (link.isSuspicious && session) {
      const pointsLost = -100;
      
      // Update session score
      setSession(prev => prev ? { ...prev, score: prev.score + pointsLost } : null);
      
      // Show feedback toast
      setFeedbackToast({
        isVisible: true,
        isCorrect: false,
        pointsEarned: pointsLost,
        wasPhishing: true
      });
    }
  };

  // Handle report submission
  const handleReportSubmit = async (reportedAsPhishing: boolean, reasons: PhishingIndicator[]) => {
    if (!selectedEmail || !session) return;

    setIsSubmitting(true);
    try {
      const result: SubmitResponseResult = await submitResponse(
        selectedEmail.id,
        reportedAsPhishing,
        reasons
      );

      // Update session score
      setSession(prev => prev ? { ...prev, score: result.newScore } : null);

      // Update email as processed
      setEmails(prev => prev.map(e => 
        e.id === selectedEmail.id 
          ? { ...e, isRead: true, isReported: reportedAsPhishing }
          : e
      ));

      // Update selected email
      setSelectedEmail(prev => prev 
        ? { ...prev, isRead: true, isReported: reportedAsPhishing }
        : null
      );

      // Show feedback toast
      setFeedbackToast({
        isVisible: true,
        isCorrect: result.isCorrect,
        pointsEarned: result.pointsEarned,
        wasPhishing: result.wasPhishing
      });

      setShowReportModal(false);

      // Check if all emails now reviewed
      const updatedEmails = emails.map(e => 
        e.id === selectedEmail.id ? { ...e, isRead: true } : e
      );
      const allReviewed = updatedEmails.every(e => e.isRead);

      if (allReviewed) {
        // Fetch and show daily summary
        setTimeout(async () => {
          const summary = await getDailySummary(session.id, session.currentDay);
          setDailySummary(summary);
          setShowDailySummary(true);
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to submit response:', err);
      setError('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle mark as safe (not phishing) - directly submit without modal
  const handleMarkSafe = () => {
    if (!selectedEmail) return;
    handleReportSubmit(false, []);
  };

  // Handle opening report modal for reporting as phishing
  const handleOpenReport = () => {
    if (!selectedEmail) return;
    setShowReportModal(true);
  };

  // Handle advance to next day
  const handleAdvanceDay = async () => {
    if (!session) return;

    setIsAdvancing(true);
    try {
      const result = await advanceDay(session.id);

      if (result.isCompleted) {
        // Simulation complete - go to results
        clearStoredSession();
        router.push('/');
      } else {
        // Load next day
        setShowDailySummary(false);
        setSelectedEmail(null);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to advance day:', err);
      setError('Failed to advance to next day. Please try again.');
    } finally {
      setIsAdvancing(false);
    }
  };

  // Handle restart simulation
  const handleRestart = async () => {
    clearStoredSession();
    try {
      const { sessionId } = await createSession();
      saveSessionId(sessionId);
      setShowDailySummary(false);
      setSelectedEmail(null);
      await loadData();
    } catch (err) {
      console.error('Failed to restart:', err);
      router.push('/');
    }
  };

  // Count unreviewed emails
  const emailsRemaining = emails.filter(e => !e.isRead).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--muted)]">Loading your inbox...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-[var(--danger)] text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-[var(--muted)] mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="btn btn-primary">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* Sidebar - Hidden on mobile view */}
      {!isMobileView && (
        <Sidebar
          currentDay={session.currentDay}
          score={session.score}
          emailsRemaining={emailsRemaining}
          onShowQA={() => setShowQAPanel(true)}
          allEmailsReviewed={emailsRemaining === 0}
          onContinueDay={handleAdvanceDay}
          isAdvancing={isAdvancing}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isMobileView ? 'mobile-view-container mx-auto my-8' : ''}`}>
        {/* Header */}
        <div className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-4">
              {isMobileView && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <MobileToggle isMobile={isMobileView} onToggle={() => setIsMobileView(!isMobileView)} />
              <button
                onClick={toggleTheme}
                className="p-2 text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Score bar for mobile view */}
          {isMobileView && (
            <div className="px-3 pb-2 flex items-center justify-between text-xs">
              <span className="text-[var(--muted)]">Score: <strong>{session.score}</strong></span>
              <span className="text-[var(--muted)]">{emailsRemaining} unread</span>
            </div>
          )}
        </div>

        {/* Email Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className={`border-r border-[var(--border)] overflow-y-auto ${
            isMobileView 
              ? selectedEmail ? 'hidden' : 'w-full' 
              : 'w-80'
          }`}>
            <EmailList
              emails={emails}
              selectedId={selectedEmail?.id || null}
              onSelect={handleSelectEmail}
              isMobileView={isMobileView}
            />
          </div>

          {/* Email Detail */}
          <div className={`flex-1 overflow-hidden ${
            isMobileView && !selectedEmail ? 'hidden' : ''
          }`}>
            {selectedEmail ? (
              <>
                {/* Mobile back button */}
                {isMobileView && (
                  <div className="p-2 border-b border-[var(--border)] bg-[var(--surface)]">
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="flex items-center gap-2 text-sm text-[var(--primary)]"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Inbox
                    </button>
                  </div>
                )}
                <EmailDetail
                  email={selectedEmail}
                  isMobileView={isMobileView}
                  onLinkHover={handleLinkHover}
                  onLinkClick={handleLinkClick}
                  onReport={handleOpenReport}
                  onMarkSafe={handleMarkSafe}
                  isProcessed={selectedEmail.isRead || false}
                />
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--muted)]">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p>Select an email to read</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Continue to Next Day Button for mobile - Fixed at bottom */}
        {isMobileView && emailsRemaining === 0 && (
          <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)]">
            <button
              onClick={handleAdvanceDay}
              disabled={isAdvancing}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-[var(--success)] text-white text-sm hover:bg-[var(--success)]/90 transition-colors disabled:opacity-50"
            >
              {isAdvancing ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="font-medium">
                    {session.currentDay >= 7 ? 'View Final Results' : 'Continue to Next Day'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Status Bar - Only in desktop view */}
      {!isMobileView && (
        <StatusBar
          hoveredUrl={hoveredLink?.displayUrl || null}
          actualUrl={hoveredLink?.actualUrl || null}
          isSuspicious={hoveredLink?.isSuspicious || false}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
        emailSubject={selectedEmail?.subject || ''}
        isLoading={isSubmitting}
      />

      {/* Q&A Panel */}
      <QAPanel
        isOpen={showQAPanel}
        onClose={() => setShowQAPanel(false)}
      />

      {/* Daily Summary Modal */}
      <DailySummary
        isOpen={showDailySummary}
        summary={dailySummary}
        onClose={() => setShowDailySummary(false)}
        onContinue={dailySummary?.isSimulationComplete ? handleRestart : handleAdvanceDay}
        isLoading={isAdvancing}
      />

      {/* Feedback Toast */}
      <FeedbackToast
        isVisible={feedbackToast.isVisible}
        isCorrect={feedbackToast.isCorrect}
        pointsEarned={feedbackToast.pointsEarned}
        wasPhishing={feedbackToast.wasPhishing}
        onClose={() => setFeedbackToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}

