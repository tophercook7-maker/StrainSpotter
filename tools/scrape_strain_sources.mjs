import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { parse as parseHTML } from 'node-html-parser';

const OUT_DIR = path.join(process.cwd(), 'backend', 'data', 'sources');

// Ensure directory exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'Mozilla/5.0 (StrainSpotter Research Bot)',
        ...options.headers
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } catch (e) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw e;
  }
}

// Sources to scrape
const SOURCES = [
  {
    name: 'allbud',
    baseUrl: 'https://allbud.com',
    async scrape() {
      const strains = [];
      const categories = ['sativa', 'indica', 'hybrid'];
      
      for (const cat of categories) {
        console.log(`[allbud] Fetching ${cat} strains...`);
        try {
          const url = `${this.baseUrl}/marijuana-strains/${cat}`;
          const response = await fetchWithRetry(url);
          const html = await response.text();
          const root = parseHTML(html);
          
          const items = root.querySelectorAll('.strain-tile, .strain-card, a[href*="/marijuana-strains/"]');
          for (const item of items) {
            const href = item.getAttribute('href');
            if (!href || !href.includes('/marijuana-strains/') || href.endsWith(`/${cat}`)) continue;
            
            const name = item.text?.trim() || href.split('/').pop()?.replace(/-/g, ' ');
            if (name && name.length > 2 && name.length < 50) {
              strains.push({
                name,
                type: cat.charAt(0).toUpperCase() + cat.slice(1),
                source: 'allbud',
                sourceUrl: href.startsWith('http') ? href : `${this.baseUrl}${href}`
              });
            }
          }
          await new Promise(r => setTimeout(r, 1500));
        } catch (e) {
          console.log(`[allbud] ${cat} error:`, e.message);
        }
      }
      return strains;
    }
  },
  {
    name: 'cannaconnection',
    baseUrl: 'https://www.cannaconnection.com',
    async scrape() {
      const strains = [];
      console.log(`[cannaconnection] Fetching strain list...`);
      
      try {
        const url = `${this.baseUrl}/strains`;
        const response = await fetchWithRetry(url);
        const html = await response.text();
        const root = parseHTML(html);
        
        const items = root.querySelectorAll('a[href*="/strains/"]');
        for (const item of items) {
          const href = item.getAttribute('href');
          const name = item.text?.trim();
          
          if (name && href && name.length > 2 && name.length < 50 && !href.endsWith('/strains/')) {
            strains.push({
              name,
              source: 'cannaconnection',
              sourceUrl: href.startsWith('http') ? href : `${this.baseUrl}${href}`
            });
          }
        }
      } catch (e) {
        console.log(`[cannaconnection] error:`, e.message);
      }
      
      return strains;
    }
  },
  {
    name: 'seedfinder',
    baseUrl: 'https://en.seedfinder.eu/database/strains/alphabetical/',
    async scrape() {
      const strains = [];
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

      for (const letter of alphabet) {
        console.log(`[seedfinder] Fetching letter ${letter}...`);
        try {
          const url = `${this.baseUrl}${letter}/`;
          const response = await fetchWithRetry(url);
          const html = await response.text();
          const root = parseHTML(html);

          const items = root.querySelectorAll('table.database tr, table tr');
          for (const item of items) {
            const cells = item.querySelectorAll('td');
            if (cells.length < 2) continue;

            const name = cells[0]?.text?.trim();
            const breeder = cells[1]?.text?.trim();
            const genetics = cells[2]?.text?.trim();

            if (name && name.length > 2 && name.length < 50) {
              const lineage = genetics ? genetics
                .split(/[x×]/)
                .map(g => g.trim())
                .filter(g => g && g !== '?' && g !== 'Unknown' && g.length > 1) : [];

              strains.push({
                name,
                breeder,
                lineage: lineage.length > 0 ? lineage : undefined,
                source: 'seedfinder',
                sourceUrl: url
              });
            }
          }

          await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
          console.log(`[seedfinder] ${letter} error:`, e.message);
        }
      }

      return strains;
    }
  },
  {
    name: 'ilovegrowingmarijuana',
    baseUrl: 'https://www.ilovegrowingmarijuana.com',
    async scrape() {
      const strains = [];
      console.log(`[ilovegrowingmarijuana] Fetching strain database...`);
      
      try {
        const url = `${this.baseUrl}/marijuana-seeds/`;
        const response = await fetchWithRetry(url);
        const html = await response.text();
        const root = parseHTML(html);
        
        const items = root.querySelectorAll('a[href*="/marijuana-seeds/"], .strain-name, .product-title');
        for (const item of items) {
          const name = item.text?.trim();
          const href = item.getAttribute('href');
          
          if (name && name.length > 2 && name.length < 50) {
            strains.push({
              name: name.replace(/\s+seeds$/i, '').trim(),
              source: 'ilovegrowingmarijuana',
              sourceUrl: href ? (href.startsWith('http') ? href : `${this.baseUrl}${href}`) : undefined
            });
          }
        }
      } catch (e) {
        console.log(`[ilovegrowingmarijuana] error:`, e.message);
      }
      
      return strains;
    }
  }
];

async function scrapeAllSources() {
  for (const source of SOURCES) {
    console.log(`\nScraping ${source.name}...`);
    try {
      const strains = await source.scrape();
      console.log(`[${source.name}] Found ${strains.length} strains`);

      // Save to file
      const outFile = path.join(OUT_DIR, `${source.name}.json`);
      fs.writeFileSync(outFile, JSON.stringify(strains, null, 2));
      console.log(`[${source.name}] Saved to ${outFile}`);
    } catch (e) {
      console.error(`[${source.name}] Error:`, e);
    }
  }
}

// Install dependencies and run
console.log('Installing required packages...');
await import('child_process').then(({ execSync }) => {
  execSync('npm install node-fetch node-html-parser', { stdio: 'inherit' });
});

console.log('\nStarting scrape...');
scrapeAllSources().catch(console.error);