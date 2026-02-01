'use client';

import { DailySummary as DailySummaryType, INDICATOR_LABELS, DAY_THEMES, PhishingIndicator } from '../../lib/types';

interface DailySummaryProps {
  isOpen: boolean;
  summary: DailySummaryType | null;
  onClose: () => void;
  onContinue: () => void;
  isLoading: boolean;
}

export default function DailySummary({ isOpen, summary, onClose, onContinue, isLoading }: DailySummaryProps) {
  if (!isOpen || !summary) return null;

  const accuracy = summary.totalEmails > 0 
    ? ((summary.correctAnswers / summary.totalEmails) * 100).toFixed(0)
    : 0;

  const dayInfo = DAY_THEMES[summary.day];
  const nextDayInfo = summary.day < 7 ? DAY_THEMES[summary.day + 1] : null;

  // Calculate indicator stats
  const getIndicatorStats = () => {
    let totalIndicators = 0;
    let correctlyIdentified = 0;
    let missed = 0;

    summary.emailBreakdown.forEach(email => {
      if (email.wasPhishing && email.indicators.length > 0) {
        totalIndicators += email.indicators.length;
        email.indicators.forEach(indicator => {
          if (email.userSelectedReasons.includes(indicator)) {
            correctlyIdentified++;
          } else {
            missed++;
          }
        });
      }
    });

    return { totalIndicators, correctlyIdentified, missed };
  };

  const indicatorStats = getIndicatorStats();

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent)]/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Day {summary.day} Complete</h2>
            </div>
            <div className="text-right">
              <div className="text-sm text-[var(--muted)]">Score</div>
              <div className="text-3xl font-bold">{summary.finalScore.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Stats Grid */}
          <div className="p-6 border-b border-[var(--border)]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[var(--background)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[var(--primary)]">{accuracy}%</div>
                <div className="text-xs text-[var(--muted)]">Accuracy</div>
              </div>
              <div className="bg-[var(--background)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[var(--success)]">{summary.correctAnswers}</div>
                <div className="text-xs text-[var(--muted)]">Correct</div>
              </div>
              <div className="bg-[var(--background)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[var(--warning)]">{summary.falsePositives}</div>
                <div className="text-xs text-[var(--muted)]">False Positives</div>
              </div>
              <div className="bg-[var(--background)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[var(--danger)]">{summary.falseNegatives}</div>
                <div className="text-xs text-[var(--muted)]">Missed Phishing</div>
              </div>
            </div>

            {/* Points Summary */}
            <div className="flex justify-center gap-8 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[var(--success)]">+{summary.pointsEarned}</span>
                <span className="text-[var(--muted)]">earned</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--danger)]">-{summary.pointsLost}</span>
                <span className="text-[var(--muted)]">lost</span>
              </div>
            </div>
          </div>

          {/* Indicator Analysis Section */}
          {indicatorStats.totalIndicators > 0 && (
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Your Reasoning Analysis
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[var(--background)] rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{indicatorStats.totalIndicators}</div>
                  <div className="text-xs text-[var(--muted)]">Total Indicators</div>
                </div>
                <div className="bg-[var(--background)] rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-[var(--success)]">{indicatorStats.correctlyIdentified}</div>
                  <div className="text-xs text-[var(--muted)]">Identified</div>
                </div>
                <div className="bg-[var(--background)] rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-[var(--danger)]">{indicatorStats.missed}</div>
                  <div className="text-xs text-[var(--muted)]">Missed</div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          <div className="p-6 border-b border-[var(--border)]">
            <p className="text-sm leading-relaxed">{summary.overallFeedback}</p>
          </div>

          {/* Email Breakdown */}
          <div className="p-6">
            <h3 className="font-semibold mb-4">Email Breakdown</h3>
            <div className="space-y-4">
              {summary.emailBreakdown.map((email) => (
                <div 
                  key={email.emailId}
                  className={`rounded-lg border overflow-hidden ${
                    email.isCorrect 
                      ? 'border-[var(--success)]/30' 
                      : 'border-[var(--danger)]/30'
                  }`}
                >
                  {/* Email Header */}
                  <div className={`p-4 ${
                    email.isCorrect 
                      ? 'bg-[var(--success)]/5' 
                      : 'bg-[var(--danger)]/5'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-lg ${email.isCorrect ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                            {email.isCorrect ? '✓' : '✗'}
                          </span>
                          <span className="font-medium truncate">{email.subject}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                          <span className={`px-2 py-0.5 rounded-full ${
                            email.wasPhishing 
                              ? 'bg-[var(--danger)]/20 text-[var(--danger)]' 
                              : 'bg-[var(--success)]/20 text-[var(--success)]'
                          }`}>
                            {email.wasPhishing ? '🎣 Phishing' : '✉️ Legitimate'}
                          </span>
                          <span>
                            You marked: <strong>{email.userReportedPhishing ? 'Phishing' : 'Safe'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Indicator Details - Only for phishing emails */}
                  {email.wasPhishing && email.indicators.length > 0 && (
                    <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
                      <div className="text-xs font-medium text-[var(--muted)] mb-3">
                        Phishing Indicators in this email:
                      </div>
                      <div className="space-y-2">
                        {email.indicators.map(indicator => {
                          const wasIdentified = email.userSelectedReasons.includes(indicator);
                          return (
                            <div 
                              key={indicator}
                              className={`flex items-center gap-2 p-2 rounded-lg ${
                                wasIdentified 
                                  ? 'bg-[var(--success)]/10' 
                                  : 'bg-[var(--danger)]/10'
                              }`}
                            >
                              <span className={`text-sm ${wasIdentified ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                                {wasIdentified ? '✓' : '✗'}
                              </span>
                              <span className="text-sm">{INDICATOR_LABELS[indicator]}</span>
                              {wasIdentified ? (
                                <span className="ml-auto text-xs text-[var(--success)]">+10 pts</span>
                              ) : (
                                <span className="ml-auto text-xs text-[var(--muted)]">missed</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Show extra indicators user selected that weren't actual */}
                      {email.userSelectedReasons.filter(r => !email.indicators.includes(r)).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[var(--border)]">
                          <div className="text-xs text-[var(--muted)] mb-2">
                            You also selected (not present in this email):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {email.userSelectedReasons
                              .filter(r => !email.indicators.includes(r))
                              .map(indicator => (
                                <span 
                                  key={indicator}
                                  className="text-xs px-2 py-0.5 rounded-full bg-[var(--warning)]/20 text-[var(--warning)]"
                                >
                                  {INDICATOR_LABELS[indicator]}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback for legitimate emails marked as phishing */}
                  {!email.wasPhishing && email.userReportedPhishing && (
                    <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
                      <div className="text-xs text-[var(--warning)]">
                        <strong>False Positive:</strong> This was a legitimate email. While it&apos;s good to be cautious, 
                        over-reporting can cause &quot;security fatigue&quot; in real organizations.
                      </div>
                      {email.userSelectedReasons.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-[var(--muted)] mb-1">You thought you saw:</div>
                          <div className="flex flex-wrap gap-1">
                            {email.userSelectedReasons.map(indicator => (
                              <span 
                                key={indicator}
                                className="text-xs px-2 py-0.5 rounded-full bg-[var(--muted)]/20 text-[var(--muted)]"
                              >
                                {INDICATOR_LABELS[indicator]}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback for missed phishing */}
                  {email.wasPhishing && !email.userReportedPhishing && (
                    <div className="p-4 border-t border-[var(--border)] bg-[var(--danger)]/5">
                      <div className="text-xs text-[var(--danger)]">
                        <strong>Missed Phishing:</strong> This was a phishing email that got through. 
                        In a real scenario, this could have led to a security breach.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border)] flex-shrink-0">
          {summary.isSimulationComplete ? (
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-2">Simulation Complete!</h3>
              <p className="text-[var(--muted)] mb-6">
                You&apos;ve completed the 7-day phishing awareness training.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={onClose} className="btn btn-ghost">
                  View Results
                </button>
                <button onClick={onContinue} className="btn btn-primary">
                  Start New Simulation
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 justify-between items-center">
              <div className="flex gap-3">
                <button onClick={onClose} className="btn btn-ghost">
                  Review Emails
                </button>
                <button 
                  onClick={onContinue} 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    <>
                      Continue to Day {summary.day + 1}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
