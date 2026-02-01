import { DayConfig, PhishingType, DifficultyLevel } from '../types';

// Day-by-day progression configuration
export const DAY_CONFIGS: DayConfig[] = [
  {
    day: 1,
    theme: 'Introduction - Obvious Attacks',
    totalEmails: 3,
    phishingCount: 1,
    legitimateCount: 2,
    phishingTypes: ['email_phishing'],
    difficultyLevels: [1],
    includeBadlyFormatted: false
  },
  {
    day: 2,
    theme: 'Urgency Tactics',
    totalEmails: 4,
    phishingCount: 2,
    legitimateCount: 2,
    phishingTypes: ['email_phishing', 'email_phishing'],
    difficultyLevels: [1, 2],
    includeBadlyFormatted: true
  },
  {
    day: 3,
    theme: 'Spear-phishing - The Human Element',
    totalEmails: 4,
    phishingCount: 2,
    legitimateCount: 2,
    phishingTypes: ['spear_phishing', 'spear_phishing'],
    difficultyLevels: [2, 2],
    includeBadlyFormatted: true
  },
  {
    day: 4,
    theme: 'Safe Harbor - False Positive Test',
    totalEmails: 5,
    phishingCount: 0,
    legitimateCount: 5,
    phishingTypes: [],
    difficultyLevels: [],
    includeBadlyFormatted: true // All legitimate but some look suspicious
  },
  {
    day: 5,
    theme: 'Modern Tactics - QR Codes & Calendar',
    totalEmails: 4,
    phishingCount: 2,
    legitimateCount: 2,
    phishingTypes: ['quishing', 'calendar_phishing'],
    difficultyLevels: [2, 2],
    includeBadlyFormatted: false
  },
  {
    day: 6,
    theme: 'Whaling - Executive Attacks',
    totalEmails: 4,
    phishingCount: 2,
    legitimateCount: 2,
    phishingTypes: ['whaling', 'whaling'],
    difficultyLevels: [1, 2],
    includeBadlyFormatted: true
  },
  {
    day: 7,
    theme: 'Boss Level - Sophisticated Attacks',
    totalEmails: 5,
    phishingCount: 3,
    legitimateCount: 2,
    phishingTypes: ['clone_phishing', 'spear_phishing', 'clone_phishing'],
    difficultyLevels: [3, 3, 3],
    includeBadlyFormatted: false
  }
];

export function getDayConfig(day: number): DayConfig {
  const config = DAY_CONFIGS.find(c => c.day === day);
  if (!config) {
    throw new Error(`Invalid day: ${day}`);
  }
  return config;
}

export function getPhishingTypeForIndex(config: DayConfig, index: number): PhishingType {
  return config.phishingTypes[index % config.phishingTypes.length];
}

export function getDifficultyForIndex(config: DayConfig, index: number): DifficultyLevel {
  return config.difficultyLevels[index % config.difficultyLevels.length];
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

