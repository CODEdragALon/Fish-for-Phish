import type { Session, Email, SubmitResponseResult, DailySummary, SessionSummary, PhishingIndicator } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }

  return response.json();
}

// Session API
export async function createSession(): Promise<{ sessionId: string; currentDay: number; score: number }> {
  return fetchApi('/sessions', { method: 'POST' });
}

export async function getSession(sessionId: string): Promise<Session> {
  return fetchApi(`/sessions/${sessionId}`);
}

export async function advanceDay(sessionId: string): Promise<{ message: string; currentDay?: number; isCompleted: boolean; finalScore?: number }> {
  return fetchApi(`/sessions/${sessionId}/advance`, { method: 'POST' });
}

export async function getSessionSummary(sessionId: string): Promise<SessionSummary> {
  return fetchApi(`/sessions/${sessionId}/summary`);
}

// Email API
export async function getEmailsForDay(sessionId: string, day: number): Promise<Email[]> {
  return fetchApi(`/emails/session/${sessionId}/day/${day}`);
}

export async function getEmail(emailId: string): Promise<Email> {
  return fetchApi(`/emails/${emailId}`);
}

export async function submitResponse(
  emailId: string,
  reportedAsPhishing: boolean,
  selectedReasons?: PhishingIndicator[]
): Promise<SubmitResponseResult> {
  return fetchApi(`/emails/${emailId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ reportedAsPhishing, selectedReasons }),
  });
}

export async function getDailySummary(sessionId: string, day: number): Promise<DailySummary> {
  return fetchApi(`/emails/session/${sessionId}/day/${day}/summary`);
}

// Storage helpers for session persistence
const SESSION_KEY = 'fish_for_phish_session';

export function saveSessionId(sessionId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, sessionId);
  }
}

export function getStoredSessionId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SESSION_KEY);
  }
  return null;
}

export function clearStoredSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

