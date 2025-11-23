import { getStrainLibraryInfo } from './strainLibrary.js';

/**
 * Build a comprehensive grow profile for a canonical strain
 * @param {object} canonical - Canonical strain object with { name, source, confidence }
 * @returns {Promise<object|null>} Grow profile object or null if strain unknown
 */
export async function buildGrowProfile(canonical) {
  if (!canonical || !canonical.name) {
    console.warn('[buildGrowProfile] No canonical strain provided');
    return null;
  }

  const strainName = canonical.name;

  // Skip if strain is unknown
  if (strainName === 'Cannabis (strain unknown)' || strainName.toLowerCase().includes('unknown')) {
    return null;
  }

  try {
    // Get strain library info
    const lib = await getStrainLibraryInfo(strainName);

    if (!lib) {
      console.log('[buildGrowProfile] No library info found for', strainName);
      // Return a basic profile even without library data
      return {
        strain: strainName,
        type: 'hybrid',
        vigor: 'balanced',
        dwc: { schedule: generateDefaultDWCSchedule() },
        coco: { schedule: generateDefaultCocoSchedule() },
        soil: { notes: generateDefaultSoilNotes() },
        vpd: generateDefaultVPD(),
        harvest: generateDefaultHarvest(),
        growNotes: ['Standard cannabis cultivation practices apply.'],
      };
    }

    // Extract strain characteristics
    const indica = lib.indica ?? 50;
    const sativa = lib.sativa ?? 50;
    const floweringWeeks = lib.flowering ?? 9;
    const thc = lib.thc || null;
    const terps = lib.terps || [];

    // Determine vigor based on sativa/indica ratio
    let vigor = 'balanced';
    if (sativa >= 60) {
      vigor = 'high'; // Sativa-dominant: tall, stretchy
    } else if (indica >= 70) {
      vigor = 'short/bushy'; // Indica-dominant: compact, bushy
    }

    // Generate schedules based on strain characteristics
    const dwcSchedule = generateDWCSchedule(indica, sativa, floweringWeeks);
    const cocoSchedule = generateCocoSchedule(indica, sativa, floweringWeeks);
    const soilNotes = generateSoilNotes(indica, sativa, floweringWeeks, thc);

    // Generate VPD targets
    const vpd = generateVPD(indica, sativa);

    // Generate harvest window
    const harvest = generateHarvestWindow(floweringWeeks, indica, sativa);

    // Generate strain-specific notes
    const growNotes = generateGrowNotes(strainName, indica, sativa, thc, terps, lib.lineage);

    return {
      strain: strainName,
      type: `${indica}% indica / ${sativa}% sativa`,
      vigor,
      dwc: { schedule: dwcSchedule },
      coco: { schedule: cocoSchedule },
      soil: { notes: soilNotes },
      vpd,
      harvest,
      growNotes,
    };
  } catch (err) {
    console.error('[buildGrowProfile] Error generating profile', {
      strainName,
      message: err?.message || String(err),
    });
    // Return a safe fallback
    return {
      strain: strainName,
      type: 'hybrid',
      vigor: 'balanced',
      dwc: { schedule: generateDefaultDWCSchedule() },
      coco: { schedule: generateDefaultCocoSchedule() },
      soil: { notes: generateDefaultSoilNotes() },
      vpd: generateDefaultVPD(),
      harvest: generateDefaultHarvest(),
      growNotes: ['Standard cultivation practices apply.'],
    };
  }
}

/**
 * Generate DWC (Deep Water Culture) feeding schedule
 */
function generateDWCSchedule(indica, sativa, floweringWeeks) {
  const vegWeeks = sativa >= 60 ? 6 : indica >= 70 ? 4 : 5;
  const totalWeeks = vegWeeks + floweringWeeks;

  return {
    veg: {
      weeks: vegWeeks,
      ec: '1.2-1.6',
      ph: '5.5-6.0',
      nutrients: 'Balanced NPK (20-20-20) or veg-specific formula',
    },
    flower: {
      weeks: floweringWeeks,
      ec: '1.8-2.2',
      ph: '5.5-6.0',
      nutrients: 'Bloom formula (5-15-10) with PK boost weeks 3-6',
    },
    flush: {
      weeks: 1,
      ec: '0.0-0.2',
      ph: '5.5-6.0',
      notes: 'Plain pH-adjusted water for final week',
    },
  };
}

/**
 * Generate Coco Coir feeding schedule
 */
function generateCocoSchedule(indica, sativa, floweringWeeks) {
  const vegWeeks = sativa >= 60 ? 6 : indica >= 70 ? 4 : 5;

  return {
    veg: {
      weeks: vegWeeks,
      ec: '1.4-1.8',
      ph: '5.8-6.2',
      nutrients: 'Coco-specific veg formula, feed daily',
      runoff: '10-20%',
    },
    flower: {
      weeks: floweringWeeks,
      ec: '1.8-2.4',
      ph: '5.8-6.2',
      nutrients: 'Bloom formula with cal-mag supplement',
      runoff: '10-20%',
    },
    flush: {
      weeks: 1,
      ec: '0.0-0.2',
      ph: '5.8-6.2',
      notes: 'Final flush with plain pH-adjusted water',
    },
  };
}

/**
 * Generate Soil growing notes
 */
function generateSoilNotes(indica, sativa, floweringWeeks, thc) {
  const notes = [];

  if (indica >= 70) {
    notes.push('Indica-dominant: Compact growth, ideal for small spaces.');
    notes.push('Lower nutrient needs; avoid overfeeding.');
  } else if (sativa >= 60) {
    notes.push('Sativa-dominant: Expect significant stretch during flower.');
    notes.push('May need support structures (trellis, stakes).');
  } else {
    notes.push('Balanced hybrid: Moderate growth pattern.');
  }

  notes.push(`Flowering time: ${floweringWeeks} weeks.`);

  if (thc && thc > 20) {
    notes.push('High THC strain: Monitor for stress and nutrient sensitivity.');
  }

  notes.push('Use organic soil mix with good drainage.');
  notes.push('Top-dress with compost or organic nutrients during veg.');
  notes.push('Reduce nitrogen and increase phosphorus/potassium during flower.');

  return notes;
}

/**
 * Generate default DWC schedule
 */
function generateDefaultDWCSchedule() {
  return {
    veg: {
      weeks: 5,
      ec: '1.2-1.6',
      ph: '5.5-6.0',
      nutrients: 'Balanced NPK (20-20-20)',
    },
    flower: {
      weeks: 9,
      ec: '1.8-2.2',
      ph: '5.5-6.0',
      nutrients: 'Bloom formula (5-15-10)',
    },
    flush: {
      weeks: 1,
      ec: '0.0-0.2',
      ph: '5.5-6.0',
      notes: 'Plain pH-adjusted water',
    },
  };
}

/**
 * Generate default Coco schedule
 */
function generateDefaultCocoSchedule() {
  return {
    veg: {
      weeks: 5,
      ec: '1.4-1.8',
      ph: '5.8-6.2',
      nutrients: 'Coco-specific veg formula',
      runoff: '10-20%',
    },
    flower: {
      weeks: 9,
      ec: '1.8-2.4',
      ph: '5.8-6.2',
      nutrients: 'Bloom formula with cal-mag',
      runoff: '10-20%',
    },
    flush: {
      weeks: 1,
      ec: '0.0-0.2',
      ph: '5.8-6.2',
      notes: 'Final flush',
    },
  };
}

/**
 * Generate default soil notes
 */
function generateDefaultSoilNotes() {
  return [
    'Use organic soil mix with good drainage.',
    'Top-dress with compost during veg.',
    'Reduce nitrogen during flower.',
  ];
}

/**
 * Generate VPD (Vapor Pressure Deficit) targets
 */
function generateVPD(indica, sativa) {
  // Indica prefers slightly lower VPD, sativa slightly higher
  const baseVPD = 1.0;

  let vegVPD = baseVPD;
  let flowerVPD = baseVPD;

  if (indica >= 70) {
    vegVPD = 0.8;
    flowerVPD = 1.0;
  } else if (sativa >= 60) {
    vegVPD = 1.0;
    flowerVPD = 1.2;
  }

  return {
    veg: {
      vpd: vegVPD,
      temp: '72-78°F',
      humidity: '60-70%',
    },
    flower: {
      vpd: flowerVPD,
      temp: '68-75°F',
      humidity: '45-55%',
    },
  };
}

/**
 * Generate default VPD
 */
function generateDefaultVPD() {
  return {
    veg: {
      vpd: 1.0,
      temp: '72-78°F',
      humidity: '60-70%',
    },
    flower: {
      vpd: 1.0,
      temp: '68-75°F',
      humidity: '45-55%',
    },
  };
}

/**
 * Generate harvest window prediction
 */
function generateHarvestWindow(floweringWeeks, indica, sativa) {
  const baseWeeks = floweringWeeks || 9;
  const estWeeks = baseWeeks;

  // Indica typically finishes faster, sativa longer
  let windowStart = estWeeks - 1;
  let windowEnd = estWeeks + 1;

  if (indica >= 70) {
    windowStart = estWeeks - 1;
    windowEnd = estWeeks;
  } else if (sativa >= 60) {
    windowStart = estWeeks;
    windowEnd = estWeeks + 2;
  }

  return {
    estWeeks,
    windowStart,
    windowEnd,
    notes: `Harvest window: weeks ${windowStart}-${windowEnd} of flower. Check trichomes for optimal harvest time.`,
  };
}

/**
 * Generate default harvest window
 */
function generateDefaultHarvest() {
  return {
    estWeeks: 9,
    windowStart: 8,
    windowEnd: 10,
    notes: 'Harvest window: weeks 8-10 of flower. Check trichomes.',
  };
}

/**
 * Generate strain-specific grow notes
 */
function generateGrowNotes(strainName, indica, sativa, thc, terps, lineage) {
  const notes = [];

  // Add notes based on characteristics
  if (sativa >= 60) {
    notes.push('Sativa-dominant: Provide ample vertical space and support.');
    notes.push('Longer flowering period; be patient.');
  }

  if (indica >= 70) {
    notes.push('Indica-dominant: Compact, bushy growth.');
    notes.push('Shorter flowering time; faster harvest.');
  }

  if (thc && thc > 25) {
    notes.push('Very high THC: Monitor closely for stress and nutrient burn.');
  }

  if (terps && terps.length > 0) {
    const topTerps = terps.slice(0, 3).join(', ');
    notes.push(`Dominant terpenes: ${topTerps}.`);
  }

  if (lineage) {
    notes.push(`Lineage: ${lineage}.`);
  }

  // Add general tips
  notes.push('Maintain consistent environment (temp, humidity, light).');
  notes.push('Monitor pH and EC regularly.');
  notes.push('Watch for pests and mold, especially in dense indica buds.');

  return notes;
}
