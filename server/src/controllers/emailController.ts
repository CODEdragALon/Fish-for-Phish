import prisma from '../lib/prisma';
import { calculateScore, calculateDailyStats, generateOverallFeedback } from '../services/scoreCalculator';
import { 
  EmailResponse, 
  SubmitResponseResult, 
  DailySummaryResponse,
  PhishingIndicator,
  EmailLink,
  ThreadEmail,
  CalendarDetails,
  HeaderInfo
} from '../types';

export async function getEmailsForDay(sessionId: string, day: number): Promise<EmailResponse[]> {
  const emails = await prisma.email.findMany({
    where: {
      sessionId,
      day
    },
    include: {
      response: true
    },
    orderBy: {
      timestamp: 'desc'
    }
  });

  return emails.map(email => ({
    id: email.id,
    sender: email.sender,
    senderEmail: email.senderEmail,
    subject: email.subject,
    body: email.body,
    timestamp: email.timestamp.toISOString(),
    hasAttachment: email.hasAttachment,
    attachmentName: email.attachmentName || undefined,
    hasQrCode: email.hasQrCode,
    qrCodeUrl: email.qrCodeUrl || undefined,
    hasCalendarInvite: email.hasCalendarInvite,
    calendarDetails: email.calendarDetails ? JSON.parse(email.calendarDetails) as CalendarDetails : undefined,
    isThreaded: email.isThreaded,
    threadEmails: email.threadEmails ? JSON.parse(email.threadEmails) as ThreadEmail[] : undefined,
    links: email.links ? JSON.parse(email.links) as EmailLink[] : undefined,
    headerInfo: email.headerInfo ? JSON.parse(email.headerInfo) as HeaderInfo : undefined,
    isRead: !!email.response,
    isReported: email.response?.reportedAsPhishing || false
  }));
}

export async function getEmailById(emailId: string): Promise<EmailResponse | null> {
  const email = await prisma.email.findUnique({
    where: { id: emailId },
    include: { response: true }
  });

  if (!email) return null;

  return {
    id: email.id,
    sender: email.sender,
    senderEmail: email.senderEmail,
    subject: email.subject,
    body: email.body,
    timestamp: email.timestamp.toISOString(),
    hasAttachment: email.hasAttachment,
    attachmentName: email.attachmentName || undefined,
    hasQrCode: email.hasQrCode,
    qrCodeUrl: email.qrCodeUrl || undefined,
    hasCalendarInvite: email.hasCalendarInvite,
    calendarDetails: email.calendarDetails ? JSON.parse(email.calendarDetails) as CalendarDetails : undefined,
    isThreaded: email.isThreaded,
    threadEmails: email.threadEmails ? JSON.parse(email.threadEmails) as ThreadEmail[] : undefined,
    links: email.links ? JSON.parse(email.links) as EmailLink[] : undefined,
    headerInfo: email.headerInfo ? JSON.parse(email.headerInfo) as HeaderInfo : undefined,
    isRead: !!email.response,
    isReported: email.response?.reportedAsPhishing || false
  };
}

export async function submitResponse(
  emailId: string,
  reportedAsPhishing: boolean,
  selectedReasons?: PhishingIndicator[]
): Promise<SubmitResponseResult> {
  // Get the email
  const email = await prisma.email.findUnique({
    where: { id: emailId },
    include: { session: true }
  });

  if (!email) {
    throw new Error('Email not found');
  }

  // Check if already responded
  const existingResponse = await prisma.userResponse.findUnique({
    where: { emailId }
  });

  if (existingResponse) {
    throw new Error('Already responded to this email');
  }

  // Parse indicators
  const actualIndicators = email.indicators 
    ? JSON.parse(email.indicators) as PhishingIndicator[]
    : [];

  // Calculate score
  const scoreResult = calculateScore(
    email.isPhishing,
    reportedAsPhishing,
    actualIndicators,
    selectedReasons || []
  );

  const netPoints = scoreResult.pointsEarned - scoreResult.pointsLost;

  // Save response
  await prisma.userResponse.create({
    data: {
      sessionId: email.sessionId,
      emailId: email.id,
      reportedAsPhishing,
      selectedReasons: selectedReasons ? JSON.stringify(selectedReasons) : null,
      isCorrect: scoreResult.isCorrect,
      pointsEarned: netPoints
    }
  });

  // Update session score
  const newScore = email.session.score + netPoints;
  await prisma.session.update({
    where: { id: email.sessionId },
    data: { score: Math.max(0, newScore) } // Don't go below 0
  });

  return {
    isCorrect: scoreResult.isCorrect,
    pointsEarned: netPoints,
    newScore: Math.max(0, newScore),
    actualIndicators: email.isPhishing ? actualIndicators : undefined,
    wasPhishing: email.isPhishing,
    feedback: scoreResult.feedback
  };
}

export async function getDailySummary(sessionId: string, day: number): Promise<DailySummaryResponse> {
  // Get session
  const session = await prisma.session.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Get all emails for the day with their responses
  const emails = await prisma.email.findMany({
    where: { sessionId, day },
    include: { response: true }
  });

  // Check if all emails have been reviewed
  const allReviewed = emails.every(e => e.response);
  
  if (!allReviewed) {
    throw new Error('Not all emails have been reviewed');
  }

  // Calculate stats
  const responseData = emails.map(e => ({
    isCorrect: e.response!.isCorrect,
    pointsEarned: e.response!.pointsEarned,
    wasPhishing: e.isPhishing,
    reportedAsPhishing: e.response!.reportedAsPhishing
  }));

  const stats = calculateDailyStats(responseData);
  const overallFeedback = generateOverallFeedback(
    stats.correctAnswers,
    emails.length,
    stats.falsePositives,
    stats.falseNegatives
  );

  // Create or update daily result
  await prisma.dailyResult.upsert({
    where: {
      sessionId_day: { sessionId, day }
    },
    update: {
      totalEmails: emails.length,
      correctAnswers: stats.correctAnswers,
      falsePositives: stats.falsePositives,
      falseNegatives: stats.falseNegatives,
      pointsEarned: stats.pointsEarned,
      pointsLost: stats.pointsLost,
      feedback: overallFeedback
    },
    create: {
      sessionId,
      day,
      totalEmails: emails.length,
      correctAnswers: stats.correctAnswers,
      falsePositives: stats.falsePositives,
      falseNegatives: stats.falseNegatives,
      pointsEarned: stats.pointsEarned,
      pointsLost: stats.pointsLost,
      feedback: overallFeedback
    }
  });

  // Build email breakdown
  const emailBreakdown = emails.map(email => {
    const indicators = email.indicators 
      ? JSON.parse(email.indicators) as PhishingIndicator[]
      : [];
    const userReasons = email.response!.selectedReasons
      ? JSON.parse(email.response!.selectedReasons) as PhishingIndicator[]
      : [];

    let feedback = '';
    if (email.response!.isCorrect) {
      feedback = email.isPhishing 
        ? 'Correctly identified as phishing!'
        : 'Correctly identified as legitimate.';
    } else {
      feedback = email.isPhishing
        ? `Missed phishing email. Key indicators: ${indicators.join(', ')}`
        : 'This was a legitimate email. Be careful not to over-report.';
    }

    return {
      emailId: email.id,
      subject: email.subject,
      wasPhishing: email.isPhishing,
      userReportedPhishing: email.response!.reportedAsPhishing,
      isCorrect: email.response!.isCorrect,
      indicators,
      userSelectedReasons: userReasons,
      feedback
    };
  });

  return {
    day,
    totalEmails: emails.length,
    correctAnswers: stats.correctAnswers,
    falsePositives: stats.falsePositives,
    falseNegatives: stats.falseNegatives,
    pointsEarned: stats.pointsEarned,
    pointsLost: stats.pointsLost,
    finalScore: session.score,
    emailBreakdown,
    overallFeedback,
    isSimulationComplete: day >= 7
  };
}

