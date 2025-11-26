import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    openaiConfigured: !!openai,
    timestamp: new Date().toISOString()
  });
});

// Rate limiting: 5 questions per day per user (tracked client-side, but verify server-side too)
// For cost control, we'll use a cheaper model and limit response length
const MAX_QUESTIONS_PER_DAY = 5;
const MAX_RESPONSE_TOKENS = 300; // Keep responses concise to save costs

/**
 * POST /api/grow-coach/ask
 * Ask the AI Grow Coach a question about growing cannabis
 * 
 * Body: { question: string }
 * Response: { answer: string }
 */
router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (question.length > 500) {
      return res.status(400).json({ error: 'Question too long (max 500 characters)' });
    }

    // If OpenAI is not configured, return a helpful fallback
    if (!openai) {
      console.warn('[GrowCoach] OpenAI API key not configured');
      return res.json({
        answer: 'AI features are currently being set up. For now, please check the detailed guides in each tab above for comprehensive growing information. You can also try asking again later once AI is fully configured.'
      });
    }

    // System prompt to keep responses focused on growing cannabis
    const systemPrompt = `You are an expert cannabis growing coach. Provide concise, practical advice about:
- Growing techniques (germination, vegetative, flowering, harvest, dry/cure)
- Environmental control (temperature, humidity, VPD, lighting)
- Nutrients and feeding schedules
- Pest and disease management
- Troubleshooting common problems

Keep responses under ${MAX_RESPONSE_TOKENS} tokens. Be specific and actionable. If asked about something outside cannabis growing, politely redirect to growing topics.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Use cheaper model for cost control
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question.trim() }
      ],
      max_tokens: MAX_RESPONSE_TOKENS,
      temperature: 0.7
    });

    const answer = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

    res.json({ answer });

  } catch (error) {
    console.error('[GrowCoach] Error:', error);
    console.error('[GrowCoach] Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack
    });
    
    // Handle rate limiting from OpenAI
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again in a moment.',
        answer: 'I\'m receiving too many requests right now. Please wait a moment and try again, or check the detailed guides in the tabs above for immediate help.'
      });
    }

    // Handle API key errors
    if (error.status === 401 || error.code === 'invalid_api_key') {
      console.warn('[GrowCoach] OpenAI API key issue - returning fallback response');
      return res.json({
        answer: 'AI features are currently being configured. For now, please check the detailed guides in each tab above for comprehensive growing information. You can also try asking again later once AI is fully configured.'
      });
    }

    // Handle other OpenAI errors
    if (error.status >= 400 && error.status < 500) {
      return res.status(500).json({ 
        error: 'AI service error. Please try again later.',
        answer: 'I\'m experiencing technical difficulties right now. Please check the detailed guides in the tabs above for comprehensive growing information, or try again in a moment.'
      });
    }

    // Return a helpful fallback response even on errors
    res.status(500).json({ 
      error: 'Failed to process question. Please try again later.',
      answer: 'I\'m having trouble processing your question right now. Please check the detailed guides in the tabs above for comprehensive growing information, or try asking again in a moment.'
    });
  }
});

export default router;

