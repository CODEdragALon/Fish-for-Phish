// Phishing types
export type PhishingType = 
  | 'email_phishing'
  | 'spear_phishing'
  | 'whaling'
  | 'quishing'
  | 'calendar_phishing'
  | 'clone_phishing';

export type DifficultyLevel = 1 | 2 | 3;

// Email link structure
export interface EmailLink {
  displayText: string;
  displayUrl: string;
  actualUrl: string;
  isSuspicious: boolean;
}

// Thread email for clone phishing
export interface ThreadEmail {
  sender: string;
  senderEmail: string;
  timestamp: string;
  body: string;
}

// Calendar invite details
export interface CalendarDetails {
  title: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  meetingLink?: string;
}

// Email header info for advanced analysis
export interface HeaderInfo {
  spf: 'pass' | 'fail' | 'softfail' | 'none';
  dkim: 'pass' | 'fail' | 'none';
  dmarc: 'pass' | 'fail' | 'none';
  returnPath: string;
  receivedFrom: string;
  messageId: string;
}

// Phishing indicators
export const PHISHING_INDICATORS = [
  'sense_of_urgency',
  'suspicious_sender',
  'generic_greeting',
  'spelling_errors',
  'suspicious_link',
  'unexpected_attachment',
  'requests_sensitive_info',
  'too_good_to_be_true',
  'mismatched_urls',
  'poor_formatting',
  'threatens_consequences',
  'unusual_request'
] as const;

export type PhishingIndicator = typeof PHISHING_INDICATORS[number];

export const INDICATOR_LABELS: Record<PhishingIndicator, string> = {
  sense_of_urgency: 'Sense of urgency',
  suspicious_sender: 'Suspicious sender address',
  generic_greeting: 'Generic greeting',
  spelling_errors: 'Spelling/grammar errors',
  suspicious_link: 'Suspicious link URL',
  unexpected_attachment: 'Unexpected attachment',
  requests_sensitive_info: 'Requests sensitive information',
  too_good_to_be_true: 'Too good to be true offer',
  mismatched_urls: 'Mismatched URLs (hover vs display)',
  poor_formatting: 'Poor formatting',
  threatens_consequences: 'Threatens consequences',
  unusual_request: 'Unusual request'
};

// Email response from API
export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  timestamp: string;
  hasAttachment: boolean;
  attachmentName?: string;
  hasQrCode: boolean;
  qrCodeUrl?: string;
  hasCalendarInvite: boolean;
  calendarDetails?: CalendarDetails;
  isThreaded: boolean;
  threadEmails?: ThreadEmail[];
  links?: EmailLink[];
  headerInfo?: HeaderInfo;
  isRead?: boolean;
  isReported?: boolean;
}

// Session data
export interface Session {
  id: string;
  currentDay: number;
  score: number;
  isCompleted: boolean;
  emailsRemaining: number;
  allEmailsReviewed: boolean;
}

// Submit response result
export interface SubmitResponseResult {
  isCorrect: boolean;
  pointsEarned: number;
  newScore: number;
  actualIndicators?: PhishingIndicator[];
  wasPhishing: boolean;
  feedback: string;
}

// Daily summary
export interface DailySummary {
  day: number;
  totalEmails: number;
  correctAnswers: number;
  falsePositives: number;
  falseNegatives: number;
  pointsEarned: number;
  pointsLost: number;
  finalScore: number;
  emailBreakdown: {
    emailId: string;
    subject: string;
    wasPhishing: boolean;
    userReportedPhishing: boolean;
    isCorrect: boolean;
    indicators: PhishingIndicator[];
    userSelectedReasons: PhishingIndicator[];
    feedback: string;
  }[];
  overallFeedback: string;
  isSimulationComplete: boolean;
}

// Final session summary
export interface SessionSummary {
  sessionId: string;
  finalScore: number;
  isCompleted: boolean;
  totalDays: number;
  statistics: {
    totalEmails: number;
    correctAnswers: number;
    accuracy: string;
    phishingCaught: number;
    totalPhishing: number;
    phishingDetectionRate: string;
  };
  dailyBreakdown: {
    day: number;
    correctAnswers: number;
    totalEmails: number;
    pointsEarned: number;
    pointsLost: number;
  }[];
}

// Day themes for UI display
export const DAY_THEMES: Record<number, { theme: string; description: string }> = {
  1: { theme: 'Introduction', description: 'Learn to spot obvious phishing attempts' },
  2: { theme: 'Urgency Tactics', description: 'Attackers create false urgency' },
  3: { theme: 'Spear-phishing', description: 'Personalized attacks targeting you' },
  4: { theme: 'Safe Harbor', description: 'Not everything suspicious is malicious' },
  5: { theme: 'Modern Tactics', description: 'QR codes and calendar invites' },
  6: { theme: 'Whaling', description: 'Executive impersonation attacks' },
  7: { theme: 'Boss Level', description: 'Sophisticated AI-powered attacks' }
};

