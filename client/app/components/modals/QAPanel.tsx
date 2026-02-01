'use client';

interface QAPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PHISHING_TYPES = [
  {
    name: 'Email Phishing',
    icon: '📧',
    description: 'Generic mass-sent emails impersonating companies like banks, PayPal, or Amazon.',
    signs: ['Generic greetings', 'Spelling errors', 'Suspicious links', 'Urgent language']
  },
  {
    name: 'Spear Phishing',
    icon: '🎯',
    description: 'Targeted attacks using personal information about you or your company.',
    signs: ['Uses your name', 'References your company', 'Mentions colleagues', 'Personalized content']
  },
  {
    name: 'Whaling',
    icon: '🐋',
    description: 'High-value attacks targeting executives, often involving urgent financial requests.',
    signs: ['Impersonates CEO/CFO', 'Urgent wire transfers', 'Confidential language', 'Time pressure']
  },
  {
    name: 'Quishing',
    icon: '📱',
    description: 'QR code phishing - malicious QR codes that lead to fake websites.',
    signs: ['Unexpected QR codes', 'Requests to scan', 'No URL preview', 'Parking/payment scams']
  },
  {
    name: 'Calendar Phishing',
    icon: '📅',
    description: 'Fake calendar invites with malicious meeting links.',
    signs: ['Unknown organizer', 'Generic meeting title', 'Suspicious meeting link', 'Urgent time']
  },
  {
    name: 'Clone Phishing',
    icon: '👥',
    description: 'Copies of legitimate emails with malicious attachments or links.',
    signs: ['Familiar thread', 'Slight changes', 'New attachment', 'Check sender carefully']
  }
];

const SAFETY_CHECKLIST = [
  {
    title: 'Check the sender',
    description: 'Is the email address exactly what you expect? Look for typos like "paypa1.com" instead of "paypal.com".',
    icon: '👤'
  },
  {
    title: 'Hover over links',
    description: 'Before clicking any link, hover over it to see the actual URL. Does it match what\'s displayed?',
    icon: '🔗'
  },
  {
    title: 'Question urgency',
    description: 'Legitimate companies rarely demand immediate action. Phishers create panic to bypass your judgment.',
    icon: '⏰'
  },
  {
    title: 'Verify attachments',
    description: 'Never open unexpected attachments. When in doubt, contact the sender through a known channel.',
    icon: '📎'
  },
  {
    title: 'Check for personalization',
    description: '"Dear Customer" is suspicious. Legitimate senders usually know your name.',
    icon: '👋'
  },
  {
    title: 'Look for errors',
    description: 'Poor grammar, spelling mistakes, and odd formatting are red flags.',
    icon: '✏️'
  },
  {
    title: 'Verify through other channels',
    description: 'If an email asks for sensitive info, call the company directly using a number from their official website.',
    icon: '📞'
  },
  {
    title: 'Check email headers',
    description: 'SPF, DKIM, and DMARC failures indicate spoofing.',
    icon: '🔍'
  }
];

export default function QAPanel({ isOpen, onClose }: QAPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl z-50 overflow-y-auto animate-slide-right">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--surface)] border-b border-[var(--border)] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--warning)]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold">Learn & Tips</h2>
            <p className="text-xs text-[var(--muted)]">Phishing awareness guide</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Safety Checklist */}
        <section>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">✅</span>
            Safety Checklist
          </h3>
          <div className="space-y-3">
            {SAFETY_CHECKLIST.map((item, index) => (
              <div 
                key={index}
                className="bg-[var(--background)] rounded-lg p-4 border border-[var(--border)]"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-sm text-[var(--foreground)] opacity-80 mt-1">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Types of Phishing */}
        <section>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🎣</span>
            Types of Phishing
          </h3>
          <div className="space-y-3">
            {PHISHING_TYPES.map((type, index) => (
              <details 
                key={index}
                className="bg-[var(--background)] rounded-lg border border-[var(--border)] group"
              >
                <summary className="p-4 cursor-pointer list-none flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{type.icon}</span>
                    <h4 className="font-medium text-sm">{type.name}</h4>
                  </div>
                  <svg className="w-5 h-5 text-[var(--muted)] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 pt-0">
                  <p className="text-sm text-[var(--foreground)] opacity-80 mb-3">{type.description}</p>
                  <div className="text-sm">
                    <span className="font-medium">Warning signs:</span>
                    <ul className="mt-2 space-y-1">
                      {type.signs.map((sign, i) => (
                        <li key={i} className="flex items-center gap-2 text-[var(--foreground)] opacity-80">
                          <span className="text-[var(--danger)]">•</span>
                          {sign}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* What to do if clicked */}
        <section className="pb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🚨</span>
            What If I Clicked a Phishing Link?
          </h3>
          <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-lg p-4">
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-bold text-[var(--danger)]">1.</span>
                <span>Don&apos;t panic - disconnect from the internet immediately</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[var(--danger)]">2.</span>
                <span>Change your passwords for affected accounts</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[var(--danger)]">3.</span>
                <span>Enable two-factor authentication everywhere</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[var(--danger)]">4.</span>
                <span>Run a malware scan on your device</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[var(--danger)]">5.</span>
                <span>Report the incident to your IT department</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[var(--danger)]">6.</span>
                <span>Monitor your accounts for suspicious activity</span>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}

