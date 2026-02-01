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

// Day configuration
export interface DayConfig {
  day: number;
  theme: string;
  totalEmails: number;
  phishingCount: number;
  legitimateCount: number;
  phishingTypes: PhishingType[];
  difficultyLevels: DifficultyLevel[];
  includeBadlyFormatted: boolean;
}

// Score calculation
export interface ScoreResult {
  pointsEarned: number;
  pointsLost: number;
  isCorrect: boolean;
  feedback: string;
}

// API request/response types
export interface CreateSessionResponse {
  sessionId: string;
  currentDay: number;
  score: number;
}

export interface EmailResponse {
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

export interface SubmitResponseRequest {
  emailId: string;
  reportedAsPhishing: boolean;
  selectedReasons?: PhishingIndicator[];
}

export interface SubmitResponseResult {
  isCorrect: boolean;
  pointsEarned: number;
  newScore: number;
  actualIndicators?: PhishingIndicator[];
  wasPhishing: boolean;
  feedback: string;
}

export interface DailySummaryResponse {
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

