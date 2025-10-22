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
      const insert = await writeClient
        .from('scans')
        .insert({ image_url: testUrl, status: 'pending' })
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

      const visionClient = new ImageAnnotatorClient();

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

      // Call Vision API
      const [result] = await visionClient.annotateImage({
        image: { content: contentBuffer },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 50 },
          { type: 'TEXT_DETECTION' },
          { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
          { type: 'IMAGE_PROPERTIES' },
          { type: 'WEB_DETECTION', maxResults: 30 },
          { type: 'SAFE_SEARCH_DETECTION' },
          { type: 'CROP_HINTS', maxResults: 5 }
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
      // Load strain library
      let strains = [];
      const primary = path.join(process.cwd(), 'backend', 'data', 'strain_library.json');
      if (fs.existsSync(primary)) {
        strains = JSON.parse(fs.readFileSync(primary, 'utf8'));
      } else {
        const enhanced = path.join(process.cwd(), 'backend', 'data', 'strain_library_enhanced.json');
        if (fs.existsSync(enhanced)) {
          strains = JSON.parse(fs.readFileSync(enhanced, 'utf8'));
        }
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
