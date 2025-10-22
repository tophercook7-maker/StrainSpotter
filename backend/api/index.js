// Vercel serverless entrypoint - minimal version for testing
import express from 'express';
import dotenv from 'dotenv';

const app = express();
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    const supabaseOk = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    const visionOk = !!(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_VISION_JSON);
    res.json({ ok: true, supabaseConfigured: supabaseOk, googleVisionConfigured: visionOk });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/', (req, res) => {
  res.send('StrainSpotter backend is running. Hit /health for status.');
});

export default app;
