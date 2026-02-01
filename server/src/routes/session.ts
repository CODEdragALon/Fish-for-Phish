import { Router, Request, Response } from 'express';
import { createSession, getSession, advanceDay, getSessionSummary } from '../controllers/sessionController';

const router = Router();

// Create a new session
router.post('/', async (req: Request, res: Response) => {
  try {
    const session = await createSession();
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session by ID
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const session = await getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Advance to next day
router.post('/:sessionId/advance', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const result = await advanceDay(sessionId);
    res.json(result);
  } catch (error) {
    console.error('Error advancing day:', error);
    res.status(500).json({ error: 'Failed to advance day' });
  }
});

// Get session summary (final results)
router.get('/:sessionId/summary', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const summary = await getSessionSummary(sessionId);
    res.json(summary);
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

export default router;

