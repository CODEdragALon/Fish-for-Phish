import prisma from '../lib/prisma';
import { generateEmailBatch, BatchEmailRequest } from '../services/emailGenerator';
import { getDayConfig, getPhishingTypeForIndex, getDifficultyForIndex, shuffleArray } from '../services/dayScheduler';
import { CreateSessionResponse } from '../types';

export async function createSession(): Promise<CreateSessionResponse> {
  // Create the session
  const session = await prisma.session.create({
    data: {
      score: 1000,
      currentDay: 1,
      isCompleted: false
    }
  });

  // Generate emails for day 1
  await generateEmailsForDay(session.id, 1);

  return {
    sessionId: session.id,
    currentDay: session.currentDay,
    score: session.score
  };
}

export async function getSession(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      emails: {
        orderBy: { timestamp: 'desc' }
      },
      responses: true,
      dailyResults: true
    }
  });

  if (!session) return null;

  // Count how many emails have been responded to for current day
  const currentDayEmails = session.emails.filter(e => e.day === session.currentDay);
  const respondedEmails = session.responses.filter(r => 
    currentDayEmails.some(e => e.id === r.emailId)
  );

  return {
    ...session,
    emailsRemaining: currentDayEmails.length - respondedEmails.length,
    allEmailsReviewed: respondedEmails.length === currentDayEmails.length && currentDayEmails.length > 0
  };
}

export async function advanceDay(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.currentDay >= 7) {
    // Mark session as completed
    await prisma.session.update({
      where: { id: sessionId },
      data: { isCompleted: true }
    });

    return {
      message: 'Simulation completed!',
      isCompleted: true,
      finalScore: session.score
    };
  }

  const nextDay = session.currentDay + 1;

  // Update session to next day
  await prisma.session.update({
    where: { id: sessionId },
    data: { currentDay: nextDay }
  });

  // Generate emails for the new day
  await generateEmailsForDay(sessionId, nextDay);

  return {
    message: `Advanced to Day ${nextDay}`,
    currentDay: nextDay,
    isCompleted: false
  };
}

export async function getSessionSummary(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      dailyResults: {
        orderBy: { day: 'asc' }
      },
      responses: {
        include: { email: true }
      }
    }
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const totalEmails = session.responses.length;
  const correctAnswers = session.responses.filter(r => r.isCorrect).length;
  const phishingEmails = session.responses.filter(r => r.email.isPhishing);
  const phishingCaught = phishingEmails.filter(r => r.reportedAsPhishing && r.isCorrect).length;
  
  return {
    sessionId: session.id,
    finalScore: session.score,
    isCompleted: session.isCompleted,
    totalDays: session.currentDay,
    statistics: {
      totalEmails,
      correctAnswers,
      accuracy: totalEmails > 0 ? ((correctAnswers / totalEmails) * 100).toFixed(1) : 0,
      phishingCaught,
      totalPhishing: phishingEmails.length,
      phishingDetectionRate: phishingEmails.length > 0 
        ? ((phishingCaught / phishingEmails.length) * 100).toFixed(1) 
        : 100
    },
    dailyBreakdown: session.dailyResults.map(dr => ({
      day: dr.day,
      correctAnswers: dr.correctAnswers,
      totalEmails: dr.totalEmails,
      pointsEarned: dr.pointsEarned,
      pointsLost: dr.pointsLost
    }))
  };
}

async function generateEmailsForDay(sessionId: string, day: number) {
  const config = getDayConfig(day);

  // Build batch request - all emails generated in a single API call
  const batchRequest: BatchEmailRequest = {
    phishingEmails: [],
    legitimateCount: config.legitimateCount,
    includeBadlyFormatted: config.includeBadlyFormatted,
    dayTheme: config.theme
  };

  // Add phishing email specifications
  for (let i = 0; i < config.phishingCount; i++) {
    batchRequest.phishingEmails.push({
      type: getPhishingTypeForIndex(config, i),
      level: getDifficultyForIndex(config, i)
    });
  }

  console.log(`Day ${day}: Generating ${config.totalEmails} emails (${config.phishingCount} phishing, ${config.legitimateCount} legitimate) in batch...`);

  // Generate all emails in a single API call
  const generatedEmails = await generateEmailBatch(batchRequest);

  // Map to database format
  const emails = generatedEmails.map(email => ({
    sessionId,
    day,
    ...email,
    indicators: JSON.stringify(email.indicators),
    links: JSON.stringify(email.links),
    threadEmails: email.isThreaded ? JSON.stringify(email.threadEmails) : null,
    calendarDetails: email.hasCalendarInvite ? JSON.stringify(email.calendarDetails) : null,
    headerInfo: JSON.stringify(email.headerInfo)
  }));

  // Shuffle emails so phishing and legitimate are mixed
  const shuffledEmails = shuffleArray(emails);

  // Add timestamps with slight variations
  const now = new Date();
  shuffledEmails.forEach((email, index) => {
    const timestamp = new Date(now.getTime() - (index * 15 * 60 * 1000)); // 15 min apart
    (email as any).timestamp = timestamp;
  });

  // Save to database
  await prisma.email.createMany({
    data: shuffledEmails
  });

  console.log(`Day ${day}: Successfully saved ${shuffledEmails.length} emails`);
}

