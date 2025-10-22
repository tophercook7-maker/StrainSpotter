#!/usr/bin/env node
// Quick Vision API self-test using the same env as the backend
import dotenv from 'dotenv';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import fs from 'fs';
import path from 'path';

// Load env from ../env/.env.local
dotenv.config({ path: new URL('../../env/.env.local', import.meta.url).pathname });

async function main() {
  const input = process.argv[2] || 'https://picsum.photos/400';
  const features = [{ type: 'LABEL_DETECTION', maxResults: 8 }, { type: 'WEB_DETECTION', maxResults: 10 }];
  const client = new ImageAnnotatorClient();

  const isLocal = fs.existsSync(input) || input.startsWith('file:') || input.startsWith('/');
  let image;
  if (isLocal) {
    const p = input.startsWith('file:') ? new URL(input) : input;
    const abs = typeof p === 'string' ? path.resolve(p) : p;
    const content = fs.readFileSync(abs);
    image = { content };
  } else {
    image = { source: { imageUri: input } };
  }

  const [result] = await client.annotateImage({ image, features });
  const labels = (result.labelAnnotations || []).map(x => `${x.description} (${Math.round((x.score||0)*100)}%)`).slice(0,8);
  const webCount = result.webDetection?.webEntities?.length || 0;

  console.log('[vision_self_test] OK');
  console.log('Image:', isLocal ? '(local file)' : input);
  console.log('Top labels:', labels.join(', ') || 'none');
  console.log('Web entities:', webCount);
}

main().catch((e) => {
  console.error('[vision_self_test] ERROR:', e.message || e);
  process.exit(1);
});
