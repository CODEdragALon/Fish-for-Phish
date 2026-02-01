import { Router, Request, Response } from 'express';
import { 
  getEmailsForDay, 
  getEmailById, 
  submitResponse, 
  getDailySummary 
} from '../controllers/emailController';
import { SubmitResponseRequest } from '../types';

const router = Router();

// Get all emails for current day
router.get('/session/:sessionId/day/:day', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const day = req.params.day as string;
    const emails = await getEmailsForDay(sessionId, parseInt(day));
    res.json(emails);
  } catch (error) {
    console.error('Error getting emails:', error);
    res.status(500).json({ error: 'Failed to get emails' });
  }
});

// Get single email by ID
router.get('/:emailId', async (req: Request, res: Response) => {
  try {
    const emailId = req.params.emailId as string;
    const email = await getEmailById(emailId);
    if (!email) {
      res.status(404).json({ error: 'Email not found' });
      return;
    }
    res.json(email);
  } catch (error) {
    console.error('Error getting email:', error);
    res.status(500).json({ error: 'Failed to get email' });
  }
});

// Submit response for an email
router.post('/:emailId/respond', async (req: Request, res: Response) => {
  try {
    const emailId = req.params.emailId as string;
    const { reportedAsPhishing, selectedReasons } = req.body as SubmitResponseRequest;
    
    const result = await submitResponse(emailId, reportedAsPhishing, selectedReasons);
    res.json(result);
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Get daily summary after completing all emails
router.get('/session/:sessionId/day/:day/summary', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const day = req.params.day as string;
    const summary = await getDailySummary(sessionId, parseInt(day));
    res.json(summary);
  } catch (error) {
    console.error('Error getting daily summary:', error);
    res.status(500).json({ error: 'Failed to get daily summary' });
  }
});

export default router;

