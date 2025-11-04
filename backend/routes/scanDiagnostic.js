// Diagnostic endpoint for comprehensive scan testing
import express from 'express';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { supabase } from '../supabaseClient.js';
import { matchStrainByVisuals } from '../services/visualMatcher.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Shared example images for quick testing
const EXAMPLE_IMAGES = [
  // Close-up bud photos
  'https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1623043284279-e1de67d82f8d?q=80&w=1200&auto=format&fit=crop',
  // Packaged product with text (tests OCR path)
  'https://images.unsplash.com/photo-1558155316-50a38f1b4f2a?q=80&w=1200&auto=format&fit=crop',
  // Generic fallback image service
  'https://picsum.photos/seed/cannabis/800'
];

async function runScanDiagnostic(req, res) {
  const startTime = Date.now();
  const diagnostics = {
    timestamp: new Date().toISOString(),
    testUrl: req.query.url || EXAMPLE_IMAGES[0],
    examples: EXAMPLE_IMAGES,
    steps: {},
    summary: {
      allPassed: false,
      totalDuration: 0,
      errors: []
    }
  };

  try {
    // Step 1: Health check
    const healthStart = Date.now();
    const healthCheck = {
      passed: false,
      duration: 0,
      result: null,
      error: null
    };

    try {
      const supabaseOk = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
      const visionOk = !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.GOOGLE_VISION_JSON;
      healthCheck.result = { supabaseConfigured: supabaseOk, googleVisionConfigured: visionOk };
      healthCheck.passed = supabaseOk && visionOk;
      healthCheck.duration = Date.now() - healthStart;
    } catch (e) {
      healthCheck.error = String(e);
      healthCheck.duration = Date.now() - healthStart;
      console.error(JSON.stringify({ tag: 'scanDiagnostic', step: 'health', error: e?.message || e }));
      diagnostics.summary.errors.push(`Health: ${e.message || e}`);
    }
    diagnostics.steps.health = healthCheck;

    if (!healthCheck.passed) {
      diagnostics.summary.allPassed = false;
      diagnostics.summary.totalDuration = Date.now() - startTime;
      return res.json(diagnostics);
    }

    // Step 2: Create scan from URL
    const createStart = Date.now();
    const createStep = {
      passed: false,
      duration: 0,
      scanId: null,
      imageUrl: null,
      error: null
    };

    try {
      const writeClient = supabaseAdmin ?? supabase;

      const testUrl = req.query.url || EXAMPLE_IMAGES[0];
      // Use a test user_id for diagnostic scans (required for image_key generation)
      const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

      const insert = await writeClient
        .from('scans')
        .insert({
          image_url: testUrl,
          status: 'pending',
          user_id: TEST_USER_ID,
          image_key: `users/diagnostic/${Date.now()}-test.jpg`
        })
        .select()
        .single();

      if (insert.error) {
        throw new Error(insert.error.message);
      }

      createStep.scanId = insert.data.id;
      createStep.imageUrl = insert.data.image_url;
      createStep.passed = true;
      createStep.duration = Date.now() - createStart;
    } catch (e) {
      createStep.error = String(e);
      createStep.duration = Date.now() - createStart;
      console.error(JSON.stringify({ tag: 'scanDiagnostic', step: 'create', error: e?.message || e }));
      diagnostics.summary.errors.push(`Create: ${e.message || e}`);
    }
    diagnostics.steps.create = createStep;

    if (!createStep.passed) {
      diagnostics.summary.allPassed = false;
      diagnostics.summary.totalDuration = Date.now() - startTime;
      return res.json(diagnostics);
    }

    // Step 3: Process with Vision
    const processStart = Date.now();
    const processStep = {
      passed: false,
      duration: 0,
      result: null,
      debug: null,
      error: null
    };

    try {
      const readClient = supabaseAdmin ?? supabase;
      const writeClient = supabaseAdmin ?? supabase;

      // Initialize Vision client with inline credentials if available
      const visionClient = process.env.GOOGLE_VISION_JSON
        ? new ImageAnnotatorClient({ credentials: JSON.parse(process.env.GOOGLE_VISION_JSON) })
        : new ImageAnnotatorClient();

      // Fetch scan
      const { data: scan, error: fetchErr } = await readClient
        .from('scans')
        .select('*')
        .eq('id', createStep.scanId)
        .maybeSingle();

      if (fetchErr || !scan) {
        throw new Error(fetchErr?.message || 'Scan not found');
      }

      await writeClient.from('scans').update({ status: 'processing' }).eq('id', createStep.scanId);

      // Download image
      let contentBuffer = null;
      try {
        const resp = await fetch(scan.image_url);
        if (resp.ok) {
          const ab = await resp.arrayBuffer();
          contentBuffer = Buffer.from(ab);
        }
      } catch {}

      if (!contentBuffer) {
        throw new Error('Could not download image bytes');
      }

      // OPTIMIZED: Preprocess image for faster Vision API response
      const sharp = (await import('sharp')).default;
      const optimizedBuffer = await sharp(contentBuffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90, progressive: true })
        .toBuffer();

      // OPTIMIZED: Use only 4 essential features (45% cheaper, same accuracy)
      const [result] = await visionClient.annotateImage({
        image: { content: optimizedBuffer },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 50 },
          { type: 'IMAGE_PROPERTIES' },
          { type: 'WEB_DETECTION', maxResults: 20 },
          { type: 'TEXT_DETECTION' }
        ]
      });

      // Update scan
      await writeClient
        .from('scans')
        .update({ result, status: 'done', processed_at: new Date().toISOString() })
        .eq('id', createStep.scanId);

      processStep.result = result;
      processStep.debug = {
        labelCount: result.labelAnnotations?.length || 0,
        topLabels: (result.labelAnnotations || []).slice(0, 5).map(x => ({ 
          label: x.description, 
          score: Math.round((x.score||0)*100) 
        })),
        textBlocks: result.textAnnotations?.length || 0,
        webEntities: result.webDetection?.webEntities?.length || 0,
        objects: (result.localizedObjectAnnotations || []).length,
        dominantColors: (result.imagePropertiesAnnotation?.dominantColors?.colors || []).slice(0, 3).map(c => ({
          rgb: `rgb(${Math.round(c.color.red || 0)}, ${Math.round(c.color.green || 0)}, ${Math.round(c.color.blue || 0)})`,
          score: Math.round((c.score || 0) * 100)
        }))
      };
      processStep.passed = true;
      processStep.duration = Date.now() - processStart;
    } catch (e) {
      processStep.error = String(e);
      processStep.duration = Date.now() - processStart;
      console.error(JSON.stringify({ tag: 'scanDiagnostic', step: 'process', error: e?.message || e }));
      diagnostics.summary.errors.push(`Process: ${e.message || e}`);
    }
    diagnostics.steps.process = processStep;

    if (!processStep.passed) {
      diagnostics.summary.allPassed = false;
      diagnostics.summary.totalDuration = Date.now() - startTime;
      return res.json(diagnostics);
    }

    // Step 4: Visual match
    const matchStart = Date.now();
    const matchStep = {
      passed: false,
      duration: 0,
      matchCount: 0,
      topMatches: [],
      error: null
    };

    try {
      // Load strain library (resolve relative to this file for portability across envs)
      let strains = [];
      const primaryPath = new URL('../data/strain_library.json', import.meta.url).pathname;
      const enhancedPath = new URL('../data/strain_library_enhanced.json', import.meta.url).pathname;
      if (fs.existsSync(primaryPath)) {
        strains = JSON.parse(fs.readFileSync(primaryPath, 'utf8'));
      } else if (fs.existsSync(enhancedPath)) {
        strains = JSON.parse(fs.readFileSync(enhancedPath, 'utf8'));
      }

      if (strains.length === 0) {
        throw new Error('Strain library not found');
      }

      const matches = matchStrainByVisuals(processStep.result, strains);
      matchStep.matchCount = matches.length;
      matchStep.topMatches = matches.slice(0, 5).map(m => ({
        name: m.strain.name,
        type: m.strain.type,
        score: Math.round(m.score),
        confidence: m.confidence,
        reasoning: m.reasoning
      }));
      matchStep.passed = true;
      matchStep.duration = Date.now() - matchStart;
    } catch (e) {
      matchStep.error = String(e);
      matchStep.duration = Date.now() - matchStart;
      console.error(JSON.stringify({ tag: 'scanDiagnostic', step: 'match', error: e?.message || e }));
      diagnostics.summary.errors.push(`Match: ${e.message || e}`);
    }
    diagnostics.steps.match = matchStep;

    // Final summary
    diagnostics.summary.allPassed = 
      healthCheck.passed && 
      createStep.passed && 
      processStep.passed && 
      matchStep.passed;
    diagnostics.summary.totalDuration = Date.now() - startTime;

    res.json(diagnostics);
  } catch (e) {
    diagnostics.summary.errors.push(`Fatal: ${e.message || e}`);
    diagnostics.summary.totalDuration = Date.now() - startTime;
    console.error(JSON.stringify({ tag: 'scanDiagnostic', step: 'fatal', error: e?.message || e }));
    res.status(500).json(diagnostics);
  }
}

/**
 * GET /api/diagnostic/scan-test?url=<image_url>
 * Legacy path maintained for compatibility.
 */
router.get('/scan-test', runScanDiagnostic);

/**
 * GET /api/diagnostic/scan?url=<image_url>
 * Canonical diagnostic endpoint: runs health → create → process → match.
 */
router.get('/scan', runScanDiagnostic);

export default router;
