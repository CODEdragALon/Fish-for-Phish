import { PhishingIndicator, ScoreResult } from '../types';

// Scoring constants
const SCORES = {
  CORRECT_PHISHING_REPORT: 50,
  CORRECT_LEGITIMATE_MARK: 25,
  FALSE_POSITIVE_PENALTY: -75,
  FALSE_NEGATIVE_PENALTY: -100,
  CORRECT_INDICATOR_BONUS: 10,
  INITIAL_SCORE: 1000
};

export function calculateScore(
  isPhishing: boolean,
  reportedAsPhishing: boolean,
  actualIndicators: PhishingIndicator[],
  selectedReasons: PhishingIndicator[]
): ScoreResult {
  let pointsEarned = 0;
  let pointsLost = 0;
  let feedback = '';

  const isCorrect = isPhishing === reportedAsPhishing;

  if (isCorrect) {
    if (isPhishing) {
      // Correctly identified phishing
      pointsEarned = SCORES.CORRECT_PHISHING_REPORT;
      feedback = 'Great job! You correctly identified this phishing email.';

      // Bonus points for correct indicators
      const correctIndicators = selectedReasons.filter(r => actualIndicators.includes(r));
      const bonusPoints = correctIndicators.length * SCORES.CORRECT_INDICATOR_BONUS;
      pointsEarned += bonusPoints;

      if (correctIndicators.length > 0) {
        feedback += ` You identified ${correctIndicators.length} correct indicator(s) for a bonus of ${bonusPoints} points!`;
      }

      // Feedback on missed indicators
      const missedIndicators = actualIndicators.filter(i => !selectedReasons.includes(i));
      if (missedIndicators.length > 0) {
        feedback += ` You missed some indicators: ${formatIndicators(missedIndicators)}.`;
      }
    } else {
      // Correctly marked as legitimate
      pointsEarned = SCORES.CORRECT_LEGITIMATE_MARK;
      feedback = 'Correct! This was a legitimate email. Good eye for not over-reporting.';
    }
  } else {
    if (isPhishing) {
      // False negative - missed phishing
      pointsLost = Math.abs(SCORES.FALSE_NEGATIVE_PENALTY);
      feedback = `Missed phishing email! This was a ${formatPhishingType(actualIndicators)} attack. `;
      feedback += `Key indicators were: ${formatIndicators(actualIndicators)}.`;
    } else {
      // False positive - reported legitimate as phishing
      pointsLost = Math.abs(SCORES.FALSE_POSITIVE_PENALTY);
      feedback = 'False positive! This was a legitimate email. ';
      feedback += 'Be careful not to report everything - this causes security fatigue in real organizations.';
    }
  }

  return {
    pointsEarned,
    pointsLost,
    isCorrect,
    feedback
  };
}

function formatIndicators(indicators: PhishingIndicator[]): string {
  const labelMap: Record<PhishingIndicator, string> = {
    sense_of_urgency: 'sense of urgency',
    suspicious_sender: 'suspicious sender address',
    generic_greeting: 'generic greeting',
    spelling_errors: 'spelling/grammar errors',
    suspicious_link: 'suspicious link URL',
    unexpected_attachment: 'unexpected attachment',
    requests_sensitive_info: 'requests sensitive information',
    too_good_to_be_true: 'too good to be true offer',
    mismatched_urls: 'mismatched URLs',
    poor_formatting: 'poor formatting',
    threatens_consequences: 'threatens consequences',
    unusual_request: 'unusual request'
  };

  return indicators.map(i => labelMap[i] || i).join(', ');
}

function formatPhishingType(indicators: PhishingIndicator[]): string {
  // Infer the type based on indicators
  if (indicators.includes('unusual_request') && indicators.includes('sense_of_urgency')) {
    return 'whaling';
  }
  if (indicators.includes('suspicious_sender')) {
    return 'spear-phishing';
  }
  return 'phishing';
}

export function calculateDailyStats(
  responses: { isCorrect: boolean; pointsEarned: number; wasPhishing: boolean; reportedAsPhishing: boolean }[]
) {
  let totalPointsEarned = 0;
  let totalPointsLost = 0;
  let correctAnswers = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  for (const response of responses) {
    if (response.isCorrect) {
      correctAnswers++;
      totalPointsEarned += response.pointsEarned;
    } else {
      if (response.wasPhishing && !response.reportedAsPhishing) {
        falseNegatives++;
        totalPointsLost += Math.abs(SCORES.FALSE_NEGATIVE_PENALTY);
      } else if (!response.wasPhishing && response.reportedAsPhishing) {
        falsePositives++;
        totalPointsLost += Math.abs(SCORES.FALSE_POSITIVE_PENALTY);
      }
    }
  }

  return {
    correctAnswers,
    falsePositives,
    falseNegatives,
    pointsEarned: totalPointsEarned,
    pointsLost: totalPointsLost
  };
}

export function generateOverallFeedback(
  correctAnswers: number,
  totalEmails: number,
  falsePositives: number,
  falseNegatives: number
): string {
  const accuracy = (correctAnswers / totalEmails) * 100;
  let feedback = '';

  if (accuracy === 100) {
    feedback = 'Perfect score! You correctly identified every email. Excellent security awareness!';
  } else if (accuracy >= 80) {
    feedback = `Great job! You correctly handled ${accuracy.toFixed(0)}% of emails. `;
  } else if (accuracy >= 60) {
    feedback = `Good effort. You got ${accuracy.toFixed(0)}% correct, but there\'s room for improvement. `;
  } else {
    feedback = `This was challenging. You got ${accuracy.toFixed(0)}% correct. Review the feedback carefully. `;
  }

  if (falseNegatives > 0) {
    feedback += `You missed ${falseNegatives} phishing email(s) - always check sender addresses and hover over links! `;
  }

  if (falsePositives > 0) {
    feedback += `You had ${falsePositives} false positive(s) - remember, not every urgent email is malicious. `;
  }

  return feedback;
}

export { SCORES };

