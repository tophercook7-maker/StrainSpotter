import express from 'express';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { sendMail, isEmailConfigured } from '../services/mailer.js';

const router = express.Router();

// Quick test endpoint to see what Vision API detects from a base64 image
router.post('/vision-test', async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ error: 'base64 image required' });
    }

    // Check if Vision client is available
    let visionClient;
    try {
      // Initialize with inline credentials if available (for Vercel/serverless)
      visionClient = process.env.GOOGLE_VISION_JSON
        ? new ImageAnnotatorClient({ credentials: JSON.parse(process.env.GOOGLE_VISION_JSON) })
        : new ImageAnnotatorClient();
    } catch (e) {
      return res.status(500).json({ 
        error: 'Google Vision not configured', 
        hint: 'Set GOOGLE_APPLICATION_CREDENTIALS in env/.env.local' 
      });
    }

    // Create a temporary image buffer
    const buffer = Buffer.from(base64, 'base64');
    
    // Run Vision API annotation
    const [result] = await visionClient.annotateImage({
      image: { content: base64 },
      features: [
        { type: 'TEXT_DETECTION' },
        { type: 'LABEL_DETECTION' },
      ]
    });

    const fullText = result.textAnnotations?.[0]?.description || '';
    const labels = result.labelAnnotations?.map(l => ({ description: l.description, score: l.score })) || [];

    res.json({
      ok: true,
      fullText,
      textLength: fullText.length,
      labels: labels.slice(0, 10),
      rawResult: result
    });

  } catch (e) {
    res.status(500).json({ error: String(e), stack: e.stack });
  }
});

// Quick strain search test
router.get('/search-test', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json({ error: 'Query parameter "q" required' });
  }

  try {
    // Import strains data (assumes backend has it loaded)
    const response = await fetch(`http://localhost:${process.env.PORT || 5181}/api/search?q=${encodeURIComponent(q)}&limit=10`);
    const results = await response.json();
    
    res.json({
      query: q,
      matchCount: results.length,
      topMatches: results.slice(0, 5).map(s => ({ name: s.name, slug: s.slug, type: s.type }))
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;

// Email test endpoint to verify SMTP config quickly
router.post('/email-test', async (req, res) => {
  try {
    if (!isEmailConfigured()) {
      return res.status(501).json({
        ok: false,
        error: 'SMTP not configured',
        hint: 'Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO in the backend environment.'
      });
    }

    const to = (req.body && req.body.to) || process.env.EMAIL_TO;
    if (!to) {
      return res.status(400).json({ ok: false, error: 'Recipient missing. Set EMAIL_TO or provide { "to": "you@example.com" }.' });
    }

    const subject = 'StrainSpotter Feedback — SMTP Test';
    const text = 'This is a test email from the StrainSpotter backend to verify SMTP configuration.';
    const html = '<p>This is a <strong>test email</strong> from the StrainSpotter backend to verify SMTP configuration.</p>';

    const result = await sendMail({ to, subject, text, html });
    if (result.skipped) {
      return res.status(501).json({ ok: false, error: 'Email send skipped: SMTP not configured' });
    }
    return res.json({ ok: true, messageId: result.id, to });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
});
