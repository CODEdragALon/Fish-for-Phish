import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { 
  PhishingType, 
  DifficultyLevel, 
  EmailLink, 
  ThreadEmail, 
  CalendarDetails, 
  HeaderInfo,
  PhishingIndicator 
} from '../types';

// Lazy initialize Gemini client - tracks API key to detect changes
let genAI: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;
let currentApiKey: string | null = null;

function getGeminiClient(): GenerativeModel | null {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set - using fallback email templates');
    return null;
  }
  
  // Recreate client if API key changed (allows updating .env without full restart)
  if (!genAI || currentApiKey !== apiKey) {
    console.log('Initializing Gemini client with API key:', apiKey.substring(0, 8) + '...');
    genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    currentApiKey = apiKey;
  }
  
  return geminiModel;
}

// User persona for personalized attacks
const USER_PERSONA = {
  name: 'Alex Johnson',
  company: 'Acme Technologies',
  department: 'Finance',
  title: 'Senior Analyst',
  manager: 'Sarah Chen',
  ceo: 'Michael Roberts',
  colleagues: ['David Kim', 'Emma Wilson', 'James Brown']
};

interface GeneratedEmail {
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  isPhishing: boolean;
  phishingType: PhishingType | null;
  difficultyLevel: DifficultyLevel | null;
  indicators: PhishingIndicator[];
  links: EmailLink[];
  hasAttachment: boolean;
  attachmentName: string | null;
  hasQrCode: boolean;
  qrCodeUrl: string | null;
  hasCalendarInvite: boolean;
  calendarDetails: CalendarDetails | null;
  isThreaded: boolean;
  threadEmails: ThreadEmail[];
  headerInfo: HeaderInfo;
}

// Minimal prompt - Gemini already understands phishing types
const PHISHING_TYPE_HINTS: Record<PhishingType, string> = {
  email_phishing: 'generic mass phishing with typos and urgency',
  spear_phishing: 'targeted attack using personal info',
  whaling: 'CEO/executive impersonation requesting money',
  quishing: 'QR code leading to malicious site',
  calendar_phishing: 'fake meeting invite with suspicious link',
  clone_phishing: 'hijacked email thread with malicious link'
};

export async function generatePhishingEmail(
  type: PhishingType,
  level: DifficultyLevel
): Promise<GeneratedEmail> {
  const model = getGeminiClient();
  if (!model) {
    return generateFallbackPhishingEmail(type, level);
  }
  
  const hint = PHISHING_TYPE_HINTS[type];
  const prompt = `Generate a ${type} phishing email (${hint}).
Target: ${USER_PERSONA.name} at ${USER_PERSONA.company}.
Format your response exactly as follows:
FROM: [Display Name] <[email@domain.com]>
SUBJECT: [Subject]
BODY: [HTML Body]
INDICATORS: [comma separated flags]
LINK: [Text]|[DisplayURL]|[ActualURL]`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.8, 
        maxOutputTokens: 1000
      },
    });

    const text = result.response.text().trim();
    
    // Parse the text-based response
    const fromMatch = text.match(/FROM:\s*(.*)\s*<(.*)>/i);
    const subjectMatch = text.match(/SUBJECT:\s*(.*)/i);
    const bodyMatch = text.match(/BODY:\s*([\s\S]*?)(?=INDICATORS:|$)/i);
    const indicatorsMatch = text.match(/INDICATORS:\s*(.*)/i);
    const linkMatch = text.match(/LINK:\s*(.*)\|(.*)\|(.*)/i);

    if (!fromMatch || !subjectMatch || !bodyMatch) {
      console.warn('Text parse failed, falling back. Raw response:', text);
      return generateFallbackPhishingEmail(type, level);
    }

    const indicators = (indicatorsMatch?.[1] || '')
      .split(',')
      .map(s => s.trim() as PhishingIndicator)
      .filter(s => s);

    const links: EmailLink[] = [];
    if (linkMatch) {
      links.push({
        displayText: linkMatch[1].trim(),
        displayUrl: linkMatch[2].trim(),
        actualUrl: linkMatch[3].trim(),
        isSuspicious: true
      });
    }

    return {
      sender: fromMatch[1].trim(),
      senderEmail: fromMatch[2].trim(),
      subject: subjectMatch[1].trim(),
      body: bodyMatch[1].trim(),
      isPhishing: true,
      phishingType: type,
      difficultyLevel: level,
      indicators,
      links,
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: type === 'quishing',
      qrCodeUrl: type === 'quishing' ? 'https://malicious-qr.com' : null,
      hasCalendarInvite: type === 'calendar_phishing',
      calendarDetails: null,
      isThreaded: type === 'clone_phishing',
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, level)
    };
  } catch (error) {
    console.error('Gemini text error:', error);
    return generateFallbackPhishingEmail(type, level);
  }
}

export async function generateLegitimateEmail(badlyFormatted: boolean = false): Promise<GeneratedEmail> {
  const model = getGeminiClient();
  if (!model) {
    return generateFallbackLegitimateEmail(badlyFormatted);
  }
  
  const prompt = `Generate a ${badlyFormatted ? 'urgent-sounding but legitimate' : 'normal professional'} business email to ${USER_PERSONA.name}.
Format your response exactly as follows:
FROM: [Display Name] <[email@company.com]>
SUBJECT: [Subject]
BODY: [HTML Body]
LINK: [Text]|[URL]`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 800 },
    });

    const text = result.response.text().trim();
    
    const fromMatch = text.match(/FROM:\s*(.*)\s*<(.*)>/i);
    const subjectMatch = text.match(/SUBJECT:\s*(.*)/i);
    const bodyMatch = text.match(/BODY:\s*([\s\S]*?)(?=LINK:|$)/i);
    const linkMatch = text.match(/LINK:\s*(.*)\|(.*)/i);

    if (!fromMatch || !subjectMatch || !bodyMatch) {
      console.warn('Text parse failed, falling back. Raw response:', text);
      return generateFallbackLegitimateEmail(badlyFormatted);
    }

    const links: EmailLink[] = [];
    if (linkMatch) {
      links.push({
        displayText: linkMatch[1].trim(),
        displayUrl: linkMatch[2].trim(),
        actualUrl: linkMatch[2].trim(),
        isSuspicious: false
      });
    }

    return {
      sender: fromMatch[1].trim(),
      senderEmail: fromMatch[2].trim(),
      subject: subjectMatch[1].trim(),
      body: bodyMatch[1].trim(),
      isPhishing: false,
      phishingType: null,
      difficultyLevel: null,
      indicators: [],
      links,
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(false, null)
    };
  } catch (error) {
    console.error('Gemini text error:', error);
    return generateFallbackLegitimateEmail(badlyFormatted);
  }
}

function generateHeaderInfo(isPhishing: boolean, level: DifficultyLevel | null): HeaderInfo {
  if (!isPhishing) {
    return {
      spf: 'pass',
      dkim: 'pass',
      dmarc: 'pass',
      returnPath: 'noreply@acme-technologies.com',
      receivedFrom: 'mail.acme-technologies.com',
      messageId: `<${Date.now()}.${Math.random().toString(36)}@acme-technologies.com>`
    };
  }
  
  // Phishing emails have varying header quality based on level
  if (level === 1) {
    return {
      spf: 'fail',
      dkim: 'fail',
      dmarc: 'fail',
      returnPath: 'sender@suspicious-domain.xyz',
      receivedFrom: '192.168.1.100 (unknown)',
      messageId: `<${Date.now()}@randomserver.net>`
    };
  } else if (level === 2) {
    return {
      spf: 'softfail',
      dkim: 'none',
      dmarc: 'fail',
      returnPath: 'noreply@acme-tech0logies.com',
      receivedFrom: 'mail.acme-tech0logies.com',
      messageId: `<${Date.now()}.msg@acme-tech0logies.com>`
    };
  } else {
    // Level 3 - nearly perfect
    return {
      spf: 'pass',
      dkim: 'pass',
      dmarc: 'none',
      returnPath: 'admin@acme-technologies.co',
      receivedFrom: 'mail.acme-technologies.co',
      messageId: `<${Date.now()}.${Math.random().toString(36)}@acme-technologies.co>`
    };
  }
}

// Fallback emails when LLM fails
function generateFallbackPhishingEmail(type: PhishingType, level: DifficultyLevel): GeneratedEmail {
  const fallbacks: Record<string, GeneratedEmail> = {
    // ========== EMAIL PHISHING ==========
    'email_phishing_1': {
      sender: 'PayPa1 Security',
      senderEmail: 'security@paypa1-support.com',
      subject: 'URGENT: Your account has been compromized!!!',
      body: `<p>Dear Valued Custumer,</p>
<p>We have detected suspicous activity on your account. Your account will be <strong>permanantly suspended</strong> within 24 hours if you do not verify your information.</p>
<p><a href="https://paypa1-secure-verify.com/login">Click here to verify your account immediately</a></p>
<p>Sincerely,<br>PayPa1 Security Team</p>`,
      isPhishing: true,
      phishingType: 'email_phishing',
      difficultyLevel: 1,
      indicators: ['sense_of_urgency', 'spelling_errors', 'suspicious_sender', 'generic_greeting', 'suspicious_link', 'threatens_consequences'],
      links: [{
        displayText: 'Click here to verify your account immediately',
        displayUrl: 'https://paypa1-secure-verify.com/login',
        actualUrl: 'https://paypa1-secure-verify.com/login',
        isSuspicious: true
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 1)
    },
    'email_phishing_2': {
      sender: 'Netflix Support',
      senderEmail: 'billing@netflix-account.com',
      subject: 'Payment Failed - Update Required',
      body: `<p>Hi there,</p>
<p>We were unable to process your payment for the current billing period. Your Netflix membership will be suspended unless you update your payment information within 48 hours.</p>
<p>To continue enjoying Netflix, please update your payment details:</p>
<p><a href="https://netflix-account.com/billing/update">Update Payment Method</a></p>
<p>If you believe this is an error, please contact our support team.</p>
<p>Thanks,<br>The Netflix Team</p>`,
      isPhishing: true,
      phishingType: 'email_phishing',
      difficultyLevel: 2,
      indicators: ['sense_of_urgency', 'suspicious_sender', 'suspicious_link', 'threatens_consequences'],
      links: [{
        displayText: 'Update Payment Method',
        displayUrl: 'https://netflix-account.com/billing/update',
        actualUrl: 'https://netflix-account.com/billing/update',
        isSuspicious: true
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 2)
    },
    'email_phishing_3': {
      sender: 'Microsoft 365',
      senderEmail: 'no-reply@microsoft365.com',
      subject: 'Action Required: Unusual Sign-in Activity',
      body: `<p>Hello,</p>
<p>We detected an unusual sign-in attempt to your Microsoft account from a new device:</p>
<ul>
<li><strong>Location:</strong> Moscow, Russia</li>
<li><strong>Device:</strong> Windows PC</li>
<li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
</ul>
<p>If this wasn't you, your account may be compromised. Please secure your account immediately:</p>
<p><a href="https://microsoft365.com/security/verify">Review Account Activity</a></p>
<p>If you recognize this activity, you can ignore this message.</p>
<p>Microsoft Account Team</p>`,
      isPhishing: true,
      phishingType: 'email_phishing',
      difficultyLevel: 3,
      indicators: ['sense_of_urgency', 'suspicious_sender', 'suspicious_link'],
      links: [{
        displayText: 'Review Account Activity',
        displayUrl: 'https://microsoft365.com/security/verify',
        actualUrl: 'https://m1crosoft365-secure.com/phish',
        isSuspicious: true
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 3)
    },

    // ========== SPEAR PHISHING ==========
    'spear_phishing_1': {
      sender: 'HR Department',
      senderEmail: 'hr-department@acme-tech.net',
      subject: 'URGENT: Update Your Direct Deposit Info',
      body: `<p>Dear ${USER_PERSONA.name},</p>
<p>We are updating our payroll system and need all employes to verify their direct deposit information by end of day.</p>
<p>Please click below to update your banking details:</p>
<p><a href="https://acme-tech-hr.net/payroll/update">Update Direct Deposit</a></p>
<p>Failure to do so may result in a delay of your next paycheck.</p>
<p>Best regards,<br>HR Department</p>`,
      isPhishing: true,
      phishingType: 'spear_phishing',
      difficultyLevel: 1,
      indicators: ['sense_of_urgency', 'spelling_errors', 'suspicious_sender', 'requests_sensitive_info', 'threatens_consequences'],
      links: [{
        displayText: 'Update Direct Deposit',
        displayUrl: 'https://acme-tech-hr.net/payroll/update',
        actualUrl: 'https://acme-tech-hr.net/payroll/update',
        isSuspicious: true
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 1)
    },
    'spear_phishing_2': {
      sender: 'IT Security',
      senderEmail: 'it-security@acme-technologies.co',
      subject: `${USER_PERSONA.name} - Mandatory Security Training`,
      body: `<p>Hi ${USER_PERSONA.name},</p>
<p>As part of our annual compliance requirements, all ${USER_PERSONA.department} team members must complete the updated security awareness training by this Friday.</p>
<p>Your manager ${USER_PERSONA.manager} has been notified that your training is still pending.</p>
<p>Please complete the training here: <a href="https://acme-technologies.co/training/security">Security Training Portal</a></p>
<p>This should take approximately 15 minutes.</p>
<p>Thanks,<br>IT Security Team<br>Acme Technologies</p>`,
      isPhishing: true,
      phishingType: 'spear_phishing',
      difficultyLevel: 2,
      indicators: ['sense_of_urgency', 'suspicious_sender', 'suspicious_link'],
      links: [{
        displayText: 'Security Training Portal',
        displayUrl: 'https://acme-technologies.co/training/security',
        actualUrl: 'https://acme-technologies.co/training/security',
        isSuspicious: true
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 2)
    },
    'spear_phishing_3': {
      sender: USER_PERSONA.colleagues[0],
      senderEmail: `${USER_PERSONA.colleagues[0].toLowerCase().replace(' ', '.')}@acme-technologies.com`,
      subject: 'Re: Q4 Financial Report - Need Your Input',
      body: `<p>Hey ${USER_PERSONA.name.split(' ')[0]},</p>
<p>Quick favor - I'm finalizing the Q4 report for ${USER_PERSONA.manager} and realized I don't have access to the latest revenue projections spreadsheet.</p>
<p>Can you download it from our shared drive and send it over? I've uploaded my draft here for reference:</p>
<p><a href="https://acme-tech-files.com/shared/q4-draft">Q4 Draft Report</a></p>
<p>Need this by EOD if possible. Thanks!</p>
<p>- ${USER_PERSONA.colleagues[0].split(' ')[0]}</p>`,
      isPhishing: true,
      phishingType: 'spear_phishing',
      difficultyLevel: 3,
      indicators: ['sense_of_urgency', 'suspicious_link', 'unusual_request'],
      links: [{
        displayText: 'Q4 Draft Report',
        displayUrl: 'https://acme-tech-files.com/shared/q4-draft',
        actualUrl: 'https://acme-tech-files.com/shared/q4-draft',
        isSuspicious: true
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 3)
    },

    // ========== WHALING ==========
    'whaling_1': {
      sender: 'CEO Office',
      senderEmail: 'ceo.michael.roberts@acme-tech.org',
      subject: 'URGENT - Wire Transfer Needed ASAP!!!',
      body: `<p>${USER_PERSONA.name},</p>
<p>I need you to process a wire transfer immediatly. I'm in a meeting and can't talk. This is very urgent and confidential.</p>
<p>Amount: $45,000<br>
Recipient: Global Partners LLC<br>
Account: Will send separately</p>
<p>Please confirm you recieved this and can handle today.</p>
<p>${USER_PERSONA.ceo}<br>CEO</p>`,
      isPhishing: true,
      phishingType: 'whaling',
      difficultyLevel: 1,
      indicators: ['sense_of_urgency', 'spelling_errors', 'suspicious_sender', 'unusual_request', 'requests_sensitive_info'],
      links: [],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 1)
    },
    'whaling_2': {
      sender: USER_PERSONA.ceo,
      senderEmail: `michael.roberts@acme-technologles.com`,
      subject: 'Confidential - Acquisition Payment',
      body: `<p>Hi ${USER_PERSONA.name.split(' ')[0]},</p>
<p>I hope this finds you well. I need your assistance with a time-sensitive matter.</p>
<p>We're in the final stages of acquiring a competitor, and I need you to process a payment to secure the deal. This is highly confidential - please don't discuss with anyone else on the team, including ${USER_PERSONA.manager}.</p>
<p>Can you confirm you're available to handle a wire transfer today? I'll send the details once you confirm.</p>
<p>Thanks for your discretion on this.</p>
<p>Best,<br>${USER_PERSONA.ceo}<br>CEO, Acme Technologies</p>`,
      isPhishing: true,
      phishingType: 'whaling',
      difficultyLevel: 2,
      indicators: ['sense_of_urgency', 'suspicious_sender', 'unusual_request', 'requests_sensitive_info'],
      links: [],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 2)
    },
    'whaling_3': {
      sender: USER_PERSONA.ceo,
      senderEmail: `m.roberts@acme-technologies.co`,
      subject: 'Re: Vendor Payment - Final Approval',
      body: `<p>${USER_PERSONA.name.split(' ')[0]},</p>
<p>Following up on our discussion with the board yesterday. We've approved moving forward with the strategic partnership.</p>
<p>I need you to initiate the first milestone payment to the consulting firm. ${USER_PERSONA.manager} mentioned you'd be the best person to handle this given your experience with international transfers.</p>
<p>Details:</p>
<ul>
<li>Amount: $125,000 USD</li>
<li>Recipient: Morrison & Associates Ltd</li>
<li>Purpose: Strategic consulting - Phase 1</li>
</ul>
<p>Please process today and send me confirmation. Let me know if you have any questions.</p>
<p>Thanks,<br>Michael</p>
<p><em>Sent from my iPhone</em></p>`,
      isPhishing: true,
      phishingType: 'whaling',
      difficultyLevel: 3,
      indicators: ['sense_of_urgency', 'suspicious_sender', 'unusual_request'],
      links: [],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 3)
    },

    // ========== QUISHING (QR Code Phishing) ==========
    'quishing_1': {
      sender: 'Parking Services',
      senderEmail: 'parking@city-services-alerts.com',
      subject: 'PARKING VIOLATION - Pay Fine Now to Avoid Towing',
      body: `<p>NOTICE OF PARKING VIOLATION</p>
<p>Your vehicle has been flagged for a parking violation in the downtown area.</p>
<p>Fine Amount: $85.00<br>
Due Date: Within 48 hours to avoid additional penalties</p>
<p>Scan the QR code below to pay your fine immediately and avoid having your vehicle towed:</p>
<p>[QR CODE]</p>
<p>Failure to pay will result in additional fines and possible towing.</p>
<p>City Parking Enforcement</p>`,
      isPhishing: true,
      phishingType: 'quishing',
      difficultyLevel: 1,
      indicators: ['sense_of_urgency', 'suspicious_sender', 'threatens_consequences', 'generic_greeting'],
      links: [],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: true,
      qrCodeUrl: 'https://city-parking-pay.com/fine/pay',
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 1)
    },
    'quishing_2': {
      sender: 'Acme IT Department',
      senderEmail: 'it-support@acme-technologies.net',
      subject: 'New Wi-Fi Network Setup - Action Required',
      body: `<p>Hi Team,</p>
<p>We've upgraded our office Wi-Fi network for better security and performance. All employees need to reconnect their devices using the new authentication system.</p>
<p>To connect to the new network:</p>
<ol>
<li>Scan the QR code below with your phone</li>
<li>Enter your company credentials when prompted</li>
<li>Your device will automatically connect</li>
</ol>
<p>[QR CODE]</p>
<p>Please complete this by end of day Friday. The old network will be decommissioned next week.</p>
<p>Thanks,<br>IT Support Team</p>`,
      isPhishing: true,
      phishingType: 'quishing',
      difficultyLevel: 2,
      indicators: ['sense_of_urgency', 'suspicious_sender', 'requests_sensitive_info'],
      links: [],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: true,
      qrCodeUrl: 'https://acme-wifi-setup.net/connect',
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 2)
    },
    'quishing_3': {
      sender: 'DocuSign',
      senderEmail: 'documents@docusign-notify.com',
      subject: `Document Ready for Signature: ${USER_PERSONA.company} NDA`,
      body: `<p>Hello ${USER_PERSONA.name},</p>
<p>${USER_PERSONA.manager} has sent you a document to review and sign:</p>
<p><strong>Document:</strong> Non-Disclosure Agreement - Q4 Project<br>
<strong>Sender:</strong> ${USER_PERSONA.manager} (${USER_PERSONA.manager.toLowerCase().replace(' ', '.')}@acme-technologies.com)</p>
<p>For enhanced security, please scan the QR code below from your mobile device to access and sign the document:</p>
<p>[QR CODE]</p>
<p>This document expires in 7 days.</p>
<p>Questions? Contact ${USER_PERSONA.manager} directly.</p>
<p>DocuSign Electronic Signature Service</p>`,
      isPhishing: true,
      phishingType: 'quishing',
      difficultyLevel: 3,
      indicators: ['suspicious_sender', 'sense_of_urgency'],
      links: [],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: true,
      qrCodeUrl: 'https://docusign-secure-view.com/sign/nda',
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 3)
    },

    // ========== CALENDAR PHISHING ==========
    'calendar_phishing_1': {
      sender: 'Meeting Invite',
      senderEmail: 'calendar@meeting-invites-online.com',
      subject: 'You have been invited: Team Sync - URGENT',
      body: `<p>You have been invited to a meeting!</p>
<p><strong>Meeting:</strong> Team Sync - URGENT<br>
<strong>When:</strong> Tomorrow at 10:00 AM<br>
<strong>Organizer:</strong> team-lead@company.com</p>
<p>Click below to accept and join:</p>
<p><a href="https://meeting-join-now.com/room/abc123">Join Meeting</a></p>`,
      isPhishing: true,
      phishingType: 'calendar_phishing',
      difficultyLevel: 1,
      indicators: ['sense_of_urgency', 'suspicious_sender', 'suspicious_link', 'generic_greeting'],
      links: [{
        displayText: 'Join Meeting',
        displayUrl: 'https://meeting-join-now.com/room/abc123',
        actualUrl: 'https://meeting-join-now.com/room/abc123',
        isSuspicious: true
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: true,
      calendarDetails: {
        title: 'Team Sync - URGENT',
        date: 'Tomorrow',
        time: '10:00 AM',
        location: 'Virtual',
        organizer: 'team-lead@company.com',
        meetingLink: 'https://meeting-join-now.com/room/abc123'
      },
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 1)
    },
    'calendar_phishing_2': {
      sender: USER_PERSONA.manager,
      senderEmail: `${USER_PERSONA.manager.toLowerCase().replace(' ', '.')}@acme-technologles.com`,
      subject: `Calendar: 1:1 Performance Review - ${USER_PERSONA.name}`,
      body: `<p>Hi ${USER_PERSONA.name.split(' ')[0]},</p>
<p>I'd like to schedule your quarterly performance review. I have some feedback from the leadership team to discuss.</p>
<p><strong>Meeting Details:</strong></p>
<ul>
<li><strong>Title:</strong> Q4 Performance Review</li>
<li><strong>Date:</strong> This Friday</li>
<li><strong>Time:</strong> 2:00 PM - 2:30 PM</li>
<li><strong>Location:</strong> Virtual (link below)</li>
</ul>
<p><a href="https://teams-meeting.acme-tech.co/review">Join Microsoft Teams Meeting</a></p>
<p>Please accept the calendar invite and let me know if you have any conflicts.</p>
<p>Thanks,<br>${USER_PERSONA.manager}</p>`,
      isPhishing: true,
      phishingType: 'calendar_phishing',
      difficultyLevel: 2,
      indicators: ['suspicious_sender', 'suspicious_link', 'sense_of_urgency'],
      links: [{
        displayText: 'Join Microsoft Teams Meeting',
        displayUrl: 'https://teams-meeting.acme-tech.co/review',
        actualUrl: 'https://teams-meeting.acme-tech.co/review',
        isSuspicious: true
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: true,
      calendarDetails: {
        title: 'Q4 Performance Review',
        date: 'This Friday',
        time: '2:00 PM - 2:30 PM',
        location: 'Microsoft Teams',
        organizer: USER_PERSONA.manager,
        meetingLink: 'https://teams-meeting.acme-tech.co/review'
      },
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 2)
    },
    'calendar_phishing_3': {
      sender: 'Zoom',
      senderEmail: 'no-reply@zoom.us',
      subject: `${USER_PERSONA.ceo} has invited you: Board Strategy Discussion`,
      body: `<p>Hi ${USER_PERSONA.name},</p>
<p>${USER_PERSONA.ceo} has invited you to a scheduled Zoom meeting.</p>
<p><strong>Topic:</strong> Board Strategy Discussion - Confidential<br>
<strong>Time:</strong> ${new Date(Date.now() + 86400000).toLocaleDateString()} at 9:00 AM</p>
<p><strong>Join Zoom Meeting:</strong><br>
<a href="https://zoom.us/j/91234567890">https://zoom.us/j/91234567890</a></p>
<p>Meeting ID: 912 3456 7890<br>
Passcode: 123456</p>
<p>Please add this to your calendar and join on time. The CEO specifically requested your attendance.</p>
<p>Best regards,<br>Zoom Scheduling Service</p>`,
      isPhishing: true,
      phishingType: 'calendar_phishing',
      difficultyLevel: 3,
      indicators: ['suspicious_link', 'unusual_request'],
      links: [{
        displayText: 'https://zoom.us/j/91234567890',
        displayUrl: 'https://zoom.us/j/91234567890',
        actualUrl: 'https://z00m-meeting.com/j/malicious',
        isSuspicious: true
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: true,
      calendarDetails: {
        title: 'Board Strategy Discussion - Confidential',
        date: new Date(Date.now() + 86400000).toLocaleDateString(),
        time: '9:00 AM',
        location: 'Zoom',
        organizer: USER_PERSONA.ceo,
        meetingLink: 'https://zoom.us/j/91234567890'
      },
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(true, 3)
    },

    // ========== CLONE PHISHING ==========
    'clone_phishing_1': {
      sender: 'Dropbox',
      senderEmail: 'no-reply@dropbox-sharing.com', // Spoofed: fake domain
      subject: 'Re: Shared File - Project Documents',
      body: `<p>Hi,</p>
<p>Sorry, the previous link expired. Here's the updated link to the shared folder:</p>
<p><a href="https://dropbox-share.com/folder/project-docs">View Shared Folder</a></p>
<p>Let me know if you have issues accessing.</p>
<p>Thanks!</p>`,
      isPhishing: true,
      phishingType: 'clone_phishing',
      difficultyLevel: 1,
      indicators: ['suspicious_sender', 'suspicious_link', 'generic_greeting'],
      links: [{
        displayText: 'View Shared Folder',
        displayUrl: 'https://dropbox-share.com/folder/project-docs',
        actualUrl: 'https://dropbox-share.com/folder/project-docs',
        isSuspicious: true
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: true,
      threadEmails: [{
        sender: 'Dropbox',
        senderEmail: 'no-reply@dropbox.com', // Legitimate
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        body: '<p>John shared "Project Documents" with you. Click here to view.</p>'
      }],
      headerInfo: generateHeaderInfo(true, 1)
    },
    'clone_phishing_2': {
      sender: USER_PERSONA.colleagues[1],
      senderEmail: `${USER_PERSONA.colleagues[1].toLowerCase().replace(' ', '.')}@acme-technologies.co`, // Spoofed: .co instead of .com
      subject: 'Re: Updated Expense Report Template',
      body: `<p>Hey ${USER_PERSONA.name.split(' ')[0]},</p>
<p>Sorry about that - I uploaded the wrong version earlier. Here's the correct expense report template with the new categories:</p>
<p><a href="https://acme-sharepoint.co/files/expense-template-v2.xlsx">Download Updated Template</a></p>
<p>Use this one for your Q4 submissions.</p>
<p>Thanks!<br>${USER_PERSONA.colleagues[1].split(' ')[0]}</p>`,
      isPhishing: true,
      phishingType: 'clone_phishing',
      difficultyLevel: 2,
      indicators: ['suspicious_sender', 'suspicious_link'],
      links: [{
        displayText: 'Download Updated Template',
        displayUrl: 'https://acme-sharepoint.co/files/expense-template-v2.xlsx',
        actualUrl: 'https://acme-sharepoint.co/files/expense-template-v2.xlsx',
        isSuspicious: true
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: true,
      threadEmails: [{
        sender: USER_PERSONA.colleagues[1],
        senderEmail: `${USER_PERSONA.colleagues[1].toLowerCase().replace(' ', '.')}@acme-technologies.com`, // Legitimate
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        body: `<p>Hi team,</p><p>Attached is the new expense report template. Please use this for all Q4 submissions.</p><p>Thanks!</p>`
      }, {
        sender: USER_PERSONA.name,
        senderEmail: `${USER_PERSONA.name.toLowerCase().replace(' ', '.')}@acme-technologies.com`, // Legitimate
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        body: `<p>Thanks ${USER_PERSONA.colleagues[1].split(' ')[0]}! I'll use this for my report.</p>`
      }],
      headerInfo: generateHeaderInfo(true, 2)
    },
    'clone_phishing_3': {
      sender: USER_PERSONA.manager,
      senderEmail: `${USER_PERSONA.manager.toLowerCase().replace(' ', '.')}@acme-technoIogies.com`, // Spoofed: capital I instead of l
      subject: 'Re: Confidential - Salary Adjustment Proposal',
      body: `<p>Hi ${USER_PERSONA.name.split(' ')[0]},</p>
<p>I realized I sent you the draft version. Here's the finalized proposal with HR's approved numbers:</p>
<p><a href="https://acme-internal.com/hr/salary-proposal-final.pdf">Salary Adjustment Proposal - Final</a></p>
<p>Please review and let me know if you have any questions before our meeting tomorrow.</p>
<p>This is still confidential - please don't share with the rest of the team yet.</p>
<p>Thanks,<br>${USER_PERSONA.manager.split(' ')[0]}</p>`,
      isPhishing: true,
      phishingType: 'clone_phishing',
      difficultyLevel: 3,
      indicators: ['suspicious_sender', 'suspicious_link', 'requests_sensitive_info'],
      links: [{
        displayText: 'Salary Adjustment Proposal - Final',
        displayUrl: 'https://acme-internal.com/hr/salary-proposal-final.pdf',
        actualUrl: 'https://acme-1nternal.com/malware/payload.exe',
        isSuspicious: true
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: true,
      threadEmails: [{
        sender: USER_PERSONA.manager,
        senderEmail: `${USER_PERSONA.manager.toLowerCase().replace(' ', '.')}@acme-technologies.com`, // Legitimate
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        body: `<p>Hi ${USER_PERSONA.name.split(' ')[0]},</p><p>I wanted to discuss your compensation for next year. I've put together a proposal based on your performance this year.</p><p>Let me know when you have a few minutes to chat.</p><p>Best,<br>${USER_PERSONA.manager.split(' ')[0]}</p>`
      }, {
        sender: USER_PERSONA.name,
        senderEmail: `${USER_PERSONA.name.toLowerCase().replace(' ', '.')}@acme-technologies.com`, // Legitimate
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        body: `<p>Hi ${USER_PERSONA.manager.split(' ')[0]},</p><p>Thanks for thinking of me! I'm free tomorrow afternoon if that works?</p><p>Best,<br>${USER_PERSONA.name.split(' ')[0]}</p>`
      }, {
        sender: USER_PERSONA.manager,
        senderEmail: `${USER_PERSONA.manager.toLowerCase().replace(' ', '.')}@acme-technologies.com`, // Legitimate
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        body: `<p>Perfect. I'll send over the draft proposal so you can review before we meet.</p><p>[Attached: salary-proposal-draft.pdf]</p>`
      }],
      headerInfo: generateHeaderInfo(true, 3)
    }
  };
  
  // Try exact match first, then fall back to type match, then default
  const exactKey = `${type}_${level}`;
  if (fallbacks[exactKey]) {
    return fallbacks[exactKey];
  }
  
  // Try to find any template for this type
  const typeKey = Object.keys(fallbacks).find(k => k.startsWith(type));
  if (typeKey) {
    const template = { ...fallbacks[typeKey] };
    template.difficultyLevel = level;
    template.headerInfo = generateHeaderInfo(true, level);
    return template;
  }
  
  // Ultimate fallback
  return fallbacks['email_phishing_1'];
}

function generateFallbackLegitimateEmail(badlyFormatted: boolean): GeneratedEmail {
  // Collection of legitimate emails - some look suspicious but are real
  const badlyFormattedEmails: GeneratedEmail[] = [
    {
      sender: 'IT Systems',
      senderEmail: 'noreply@acme-technologies.com',
      subject: 'ACTION REQUIRED: Password Expiration Notice',
      body: `<p>Hello,</p>
<p>This is an automated message from the IT department.</p>
<p>Your network password will expire in 7 days. Please update your password through the standard company portal before the expiration date to avoid any disruption to your access.</p>
<p>To change your password:</p>
<ol>
<li>Go to <a href="https://portal.acme-technologies.com/password">https://portal.acme-technologies.com/password</a></li>
<li>Log in with your current credentials</li>
<li>Follow the prompts to create a new password</li>
</ol>
<p>If you have questions, contact the IT Help Desk at extension 4357.</p>
<p>IT Department<br>Acme Technologies</p>`,
      isPhishing: false,
      phishingType: null,
      difficultyLevel: null,
      indicators: [],
      links: [{
        displayText: 'https://portal.acme-technologies.com/password',
        displayUrl: 'https://portal.acme-technologies.com/password',
        actualUrl: 'https://portal.acme-technologies.com/password',
        isSuspicious: false
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(false, null)
    },
    {
      sender: 'Benefits Administrator',
      senderEmail: 'benefits@acme-technologies.com',
      subject: 'REMINDER: Open Enrollment Ends Friday!',
      body: `<p>Dear Employee,</p>
<p>This is a reminder that open enrollment for 2025 benefits closes this Friday at 5:00 PM.</p>
<p>If you haven't made your selections yet, please log into the benefits portal:</p>
<p><a href="https://benefits.acme-technologies.com">Access Benefits Portal</a></p>
<p>Changes made during open enrollment will take effect January 1st.</p>
<p>Questions? Contact HR at hr@acme-technologies.com or ext. 2100.</p>
<p>Human Resources<br>Acme Technologies</p>`,
      isPhishing: false,
      phishingType: null,
      difficultyLevel: null,
      indicators: [],
      links: [{
        displayText: 'Access Benefits Portal',
        displayUrl: 'https://benefits.acme-technologies.com',
        actualUrl: 'https://benefits.acme-technologies.com',
        isSuspicious: false
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(false, null)
    },
    {
      sender: 'Amazon Web Services',
      senderEmail: 'no-reply@aws.amazon.com',
      subject: 'Your AWS Bill is Available',
      body: `<p>Hello,</p>
<p>Your AWS bill for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} is now available.</p>
<p><strong>Account:</strong> acme-technologies-prod<br>
<strong>Total:</strong> $2,847.32</p>
<p>To view your complete bill and usage details, sign in to the AWS Billing Console:</p>
<p><a href="https://console.aws.amazon.com/billing">View Bill</a></p>
<p>Thank you for using Amazon Web Services.</p>
<p>Amazon Web Services, Inc.</p>`,
      isPhishing: false,
      phishingType: null,
      difficultyLevel: null,
      indicators: [],
      links: [{
        displayText: 'View Bill',
        displayUrl: 'https://console.aws.amazon.com/billing',
        actualUrl: 'https://console.aws.amazon.com/billing',
        isSuspicious: false
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(false, null)
    },
    {
      sender: 'Security Team',
      senderEmail: 'security@acme-technologies.com',
      subject: 'Mandatory: Complete Security Awareness Training',
      body: `<p>Hi,</p>
<p>As part of our annual compliance requirements, all employees must complete the updated security awareness training by end of month.</p>
<p>The training takes approximately 20 minutes and covers:</p>
<ul>
<li>Identifying phishing attempts</li>
<li>Safe handling of sensitive data</li>
<li>Password best practices</li>
<li>Reporting security incidents</li>
</ul>
<p>Access the training here: <a href="https://training.acme-technologies.com/security">Security Training Portal</a></p>
<p>Please complete this at your earliest convenience.</p>
<p>Information Security Team<br>Acme Technologies</p>`,
      isPhishing: false,
      phishingType: null,
      difficultyLevel: null,
      indicators: [],
      links: [{
        displayText: 'Security Training Portal',
        displayUrl: 'https://training.acme-technologies.com/security',
        actualUrl: 'https://training.acme-technologies.com/security',
        isSuspicious: false
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(false, null)
    }
  ];

  const normalEmails: GeneratedEmail[] = [
    {
      sender: USER_PERSONA.manager,
      senderEmail: `${USER_PERSONA.manager.toLowerCase().replace(' ', '.')}@acme-technologies.com`,
      subject: 'Q4 Budget Review Meeting - Notes',
      body: `<p>Hi ${USER_PERSONA.name.split(' ')[0]},</p>
<p>Thanks for joining today's budget review meeting. Here's a quick summary of what we discussed:</p>
<ul>
<li>Q4 projections are on track</li>
<li>Marketing budget increase approved</li>
<li>New vendor contracts to be reviewed next week</li>
</ul>
<p>I've attached the detailed notes. Let me know if you have any questions.</p>
<p>Best,<br>${USER_PERSONA.manager.split(' ')[0]}</p>`,
      isPhishing: false,
      phishingType: null,
      difficultyLevel: null,
      indicators: [],
      links: [],
      hasAttachment: true,
      attachmentName: 'Q4_Budget_Review_Notes.pdf',
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(false, null)
    },
    {
      sender: USER_PERSONA.colleagues[0],
      senderEmail: `${USER_PERSONA.colleagues[0].toLowerCase().replace(' ', '.')}@acme-technologies.com`,
      subject: 'Lunch tomorrow?',
      body: `<p>Hey ${USER_PERSONA.name.split(' ')[0]}!</p>
<p>A few of us are grabbing lunch at that new Thai place tomorrow around noon. Want to join?</p>
<p>Let me know!</p>
<p>- ${USER_PERSONA.colleagues[0].split(' ')[0]}</p>`,
      isPhishing: false,
      phishingType: null,
      difficultyLevel: null,
      indicators: [],
      links: [],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(false, null)
    },
    {
      sender: 'Facilities',
      senderEmail: 'facilities@acme-technologies.com',
      subject: 'Office Closure - Presidents Day',
      body: `<p>Hi everyone,</p>
<p>This is a reminder that our offices will be closed on Monday, February 17th in observance of Presidents Day.</p>
<p>Normal business hours will resume on Tuesday, February 18th.</p>
<p>If you have any urgent facilities issues during the closure, please contact our emergency line at (555) 123-4567.</p>
<p>Enjoy the long weekend!</p>
<p>Facilities Team<br>Acme Technologies</p>`,
      isPhishing: false,
      phishingType: null,
      difficultyLevel: null,
      indicators: [],
      links: [],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(false, null)
    },
    {
      sender: USER_PERSONA.colleagues[2],
      senderEmail: `${USER_PERSONA.colleagues[2].toLowerCase().replace(' ', '.')}@acme-technologies.com`,
      subject: 'Re: Project Timeline Update',
      body: `<p>Hi ${USER_PERSONA.name.split(' ')[0]},</p>
<p>Thanks for the update on the project timeline. I've reviewed the new schedule and it looks good to me.</p>
<p>I'll update my deliverables accordingly and have the first draft ready by next Wednesday.</p>
<p>Let me know if anything changes!</p>
<p>Best,<br>${USER_PERSONA.colleagues[2].split(' ')[0]}</p>`,
      isPhishing: false,
      phishingType: null,
      difficultyLevel: null,
      indicators: [],
      links: [],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(false, null)
    },
    {
      sender: 'Jira',
      senderEmail: 'jira@acme-technologies.atlassian.net',
      subject: `[ACME-1234] ${USER_PERSONA.colleagues[1]} mentioned you in a comment`,
      body: `<p>${USER_PERSONA.colleagues[1]} mentioned you in a comment on <strong>ACME-1234</strong>:</p>
<blockquote>
<p>"@${USER_PERSONA.name.toLowerCase().replace(' ', '.')} Can you take a look at this when you have a chance? I think it's related to the API changes you made last week."</p>
</blockquote>
<p><a href="https://acme-technologies.atlassian.net/browse/ACME-1234">View Issue</a></p>
<p>This message was sent by Atlassian Jira.</p>`,
      isPhishing: false,
      phishingType: null,
      difficultyLevel: null,
      indicators: [],
      links: [{
        displayText: 'View Issue',
        displayUrl: 'https://acme-technologies.atlassian.net/browse/ACME-1234',
        actualUrl: 'https://acme-technologies.atlassian.net/browse/ACME-1234',
        isSuspicious: false
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(false, null)
    },
    {
      sender: 'LinkedIn',
      senderEmail: 'messages-noreply@linkedin.com',
      subject: `${USER_PERSONA.name}, you have 3 new connection requests`,
      body: `<p>Hi ${USER_PERSONA.name.split(' ')[0]},</p>
<p>You have pending connection requests waiting for your response:</p>
<ul>
<li>Jennifer Martinez, Product Manager at TechCorp</li>
<li>Michael Thompson, Senior Developer at StartupXYZ</li>
<li>Lisa Wang, Recruiter at BigCompany Inc</li>
</ul>
<p><a href="https://www.linkedin.com/mynetwork/invitation-manager/">View Invitations</a></p>
<p>LinkedIn</p>`,
      isPhishing: false,
      phishingType: null,
      difficultyLevel: null,
      indicators: [],
      links: [{
        displayText: 'View Invitations',
        displayUrl: 'https://www.linkedin.com/mynetwork/invitation-manager/',
        actualUrl: 'https://www.linkedin.com/mynetwork/invitation-manager/',
        isSuspicious: false
      }],
      hasAttachment: false,
      attachmentName: null,
      hasQrCode: false,
      qrCodeUrl: null,
      hasCalendarInvite: false,
      calendarDetails: null,
      isThreaded: false,
      threadEmails: [],
      headerInfo: generateHeaderInfo(false, null)
    }
  ];

  // Select randomly from appropriate list
  if (badlyFormatted) {
    return badlyFormattedEmails[Math.floor(Math.random() * badlyFormattedEmails.length)];
  }
  
  return normalEmails[Math.floor(Math.random() * normalEmails.length)];
}

// Batch email generation - generates all emails for a day in a single API call
export interface BatchEmailRequest {
  phishingEmails: Array<{ type: PhishingType; level: DifficultyLevel }>;
  legitimateCount: number;
  includeBadlyFormatted: boolean;
  dayTheme: string;
}

export async function generateEmailBatch(request: BatchEmailRequest): Promise<GeneratedEmail[]> {
  const model = getGeminiClient();
  
  if (!model) {
    console.log('No Gemini client - using fallback templates');
    return generateFallbackBatch(request);
  }

  // Build minimal batch prompt
  const emailList = request.phishingEmails
    .map((e, i) => `${i + 1}. ${e.type} phishing (${PHISHING_TYPE_HINTS[e.type]})`)
    .join('\n');
  
  const legCount = request.legitimateCount;
  const totalCount = request.phishingEmails.length + legCount;

  const prompt = `Generate ${totalCount} emails as JSON array for ${USER_PERSONA.name} at ${USER_PERSONA.company}:
${emailList}
${legCount > 0 ? `${request.phishingEmails.length + 1}-${totalCount}. legitimate business emails` : ''}

Each email: {"sender":"name","senderEmail":"email","subject":"subj","body":"<p>html</p>","isPhishing":bool,"phishingType":"type"|null,"indicators":[],"links":[{"displayText":"","displayUrl":"","actualUrl":"","isSuspicious":bool}]}

Return ONLY JSON array.`;

  try {
    console.log(`Batch generating ${totalCount} emails...`);
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.8, 
        maxOutputTokens: 2000
      },
    });

    let text = result.response.text().trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);

    const parsedEmails = JSON.parse(text.trim());
    if (!Array.isArray(parsedEmails)) throw new Error('Not an array');

    console.log(`Generated ${parsedEmails.length} emails`);

    return parsedEmails.map((email: any, idx: number) => {
      const isPhishing = email.isPhishing ?? (idx < request.phishingEmails.length);
      const config = isPhishing ? request.phishingEmails[idx] : null;
      const level = config?.level || null;
      const type = config?.type || null;
      
      return {
        sender: email.sender || 'Unknown',
        senderEmail: email.senderEmail || 'unknown@example.com',
        subject: email.subject || 'No Subject',
        body: email.body || '<p>Content</p>',
        isPhishing,
        phishingType: type,
        difficultyLevel: level,
        indicators: email.indicators || [],
        links: email.links || [],
        hasAttachment: false,
        attachmentName: null,
        hasQrCode: type === 'quishing',
        qrCodeUrl: type === 'quishing' ? (email.qrCodeUrl || 'https://malicious.com') : null,
        hasCalendarInvite: type === 'calendar_phishing',
        calendarDetails: email.calendarDetails || null,
        isThreaded: type === 'clone_phishing',
        threadEmails: email.threadEmails || [],
        headerInfo: generateHeaderInfo(isPhishing, level)
      };
    });

  } catch (error) {
    console.error('Batch failed:', error);
    return generateFallbackBatch(request);
  }
}

// Fallback batch generation using templates
function generateFallbackBatch(request: BatchEmailRequest): GeneratedEmail[] {
  const emails: GeneratedEmail[] = [];

  // Generate phishing emails from fallbacks
  for (const phishingReq of request.phishingEmails) {
    emails.push(generateFallbackPhishingEmail(phishingReq.type, phishingReq.level));
  }

  // Generate legitimate emails from fallbacks
  for (let i = 0; i < request.legitimateCount; i++) {
    const badlyFormatted = request.includeBadlyFormatted && i === 0;
    emails.push(generateFallbackLegitimateEmail(badlyFormatted));
  }

  return emails;
}

export { USER_PERSONA };

