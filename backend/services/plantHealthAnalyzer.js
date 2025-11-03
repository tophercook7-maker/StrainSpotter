/**
 * Plant Health Analyzer Service
 * 
 * Analyzes cannabis plant images to determine:
 * - Growth stage (seedling, vegetative, flowering, harvest-ready)
 * - Health status (healthy, stressed, deficient, diseased)
 * - Wellness recommendations
 */

/**
 * Analyze plant health from Vision API results
 * @param {Object} visionResult - Google Vision API response
 * @returns {Object} Health analysis with stage, wellness, and recommendations
 */
export function analyzePlantHealth(visionResult) {
  const labels = (visionResult.labelAnnotations || []).map(l => ({
    label: l.description.toLowerCase(),
    score: l.score || 0
  }));

  const colors = visionResult.imagePropertiesAnnotation?.dominantColors?.colors || [];
  const objects = (visionResult.localizedObjectAnnotations || []).map(o => o.name.toLowerCase());

  // Determine growth stage
  const growthStage = determineGrowthStage(labels, objects);
  
  // Assess plant health
  const healthStatus = assessHealth(labels, colors);
  
  // Generate recommendations
  const recommendations = generateRecommendations(growthStage, healthStatus, labels);

  return {
    growthStage,
    healthStatus,
    recommendations,
    confidence: calculateConfidence(labels, growthStage, healthStatus)
  };
}

/**
 * Determine the growth stage of the plant
 */
function determineGrowthStage(labels, objects) {
  const labelTexts = labels.map(l => l.label);
  const highScoreLabels = labels.filter(l => l.score > 0.7).map(l => l.label);

  // Check for flowering indicators
  const floweringIndicators = [
    'flower', 'flowering', 'bud', 'bloom', 'pistil', 'trichome', 
    'cola', 'nug', 'cannabis flower'
  ];
  const hasFlowering = floweringIndicators.some(ind => 
    labelTexts.some(label => label.includes(ind))
  );

  // Check for vegetative indicators
  const vegetativeIndicators = [
    'leaf', 'foliage', 'plant', 'green', 'vegetation', 'stem', 'branch'
  ];
  const hasVegetative = vegetativeIndicators.some(ind => 
    labelTexts.some(label => label.includes(ind))
  );

  // Check for seedling indicators
  const seedlingIndicators = ['seedling', 'sprout', 'young plant', 'cotyledon'];
  const hasSeedling = seedlingIndicators.some(ind => 
    labelTexts.some(label => label.includes(ind))
  );

  // Check for harvest-ready indicators
  const harvestIndicators = [
    'mature', 'ripe', 'ready', 'amber', 'milky trichome', 'dense bud'
  ];
  const hasHarvest = harvestIndicators.some(ind => 
    labelTexts.some(label => label.includes(ind))
  );

  // Determine stage based on indicators
  if (hasSeedling) {
    return {
      stage: 'Seedling',
      description: 'Early growth stage with first true leaves developing',
      icon: '🌱',
      timeframe: '1-3 weeks from germination'
    };
  } else if (hasFlowering && hasHarvest) {
    return {
      stage: 'Late Flowering / Harvest Ready',
      description: 'Buds are mature with visible trichomes, approaching harvest window',
      icon: '🌺',
      timeframe: '7-10 weeks into flowering'
    };
  } else if (hasFlowering) {
    return {
      stage: 'Flowering',
      description: 'Plant is producing flowers/buds with visible pistils',
      icon: '🌸',
      timeframe: '2-8 weeks into flowering'
    };
  } else if (hasVegetative) {
    return {
      stage: 'Vegetative',
      description: 'Plant is in active growth, developing leaves and branches',
      icon: '🌿',
      timeframe: '3-8 weeks from seedling'
    };
  } else {
    return {
      stage: 'Harvested / Cured Bud',
      description: 'Dried and cured cannabis flower ready for consumption',
      icon: '🍃',
      timeframe: 'Post-harvest'
    };
  }
}

/**
 * Assess overall plant health
 */
function assessHealth(labels, colors) {
  const labelTexts = labels.map(l => l.label);
  
  // Health indicators
  const healthyIndicators = [
    'healthy', 'vibrant', 'lush', 'green', 'thriving', 'robust'
  ];
  const stressIndicators = [
    'yellow', 'brown', 'wilted', 'drooping', 'pale', 'discolored', 
    'spotted', 'burnt', 'crispy'
  ];
  const diseaseIndicators = [
    'mold', 'mildew', 'fungus', 'pest', 'insect', 'damage', 'rot'
  ];

  const hasHealthy = healthyIndicators.some(ind => 
    labelTexts.some(label => label.includes(ind))
  );
  const hasStress = stressIndicators.some(ind => 
    labelTexts.some(label => label.includes(ind))
  );
  const hasDisease = diseaseIndicators.some(ind => 
    labelTexts.some(label => label.includes(ind))
  );

  // Analyze dominant colors for health
  const greenColors = colors.filter(c => {
    const r = c.color.red || 0;
    const g = c.color.green || 0;
    const b = c.color.blue || 0;
    return g > r && g > b && g > 100; // Predominantly green
  });

  const yellowBrownColors = colors.filter(c => {
    const r = c.color.red || 0;
    const g = c.color.green || 0;
    const b = c.color.blue || 0;
    return (r > 150 && g > 100 && b < 100); // Yellow/brown tones
  });

  const greenPercentage = greenColors.reduce((sum, c) => sum + (c.pixelFraction || 0), 0);
  const yellowBrownPercentage = yellowBrownColors.reduce((sum, c) => sum + (c.pixelFraction || 0), 0);

  // Determine health status
  let status, level, color, issues = [];

  if (hasDisease) {
    status = 'Diseased';
    level = 'critical';
    color = '#f44336';
    issues.push('Possible disease or pest infestation detected');
  } else if (hasStress || yellowBrownPercentage > 0.3) {
    status = 'Stressed';
    level = 'warning';
    color = '#ff9800';
    if (yellowBrownPercentage > 0.3) {
      issues.push('Yellowing or browning detected - possible nutrient deficiency');
    }
    if (hasStress) {
      issues.push('Signs of environmental stress');
    }
  } else if (hasHealthy || greenPercentage > 0.5) {
    status = 'Healthy';
    level = 'good';
    color = '#4caf50';
    issues.push('Plant appears healthy with good coloration');
  } else {
    status = 'Fair';
    level = 'moderate';
    color = '#ffc107';
    issues.push('Plant condition appears average');
  }

  return {
    status,
    level,
    color,
    issues,
    metrics: {
      greenPercentage: Math.round(greenPercentage * 100),
      yellowBrownPercentage: Math.round(yellowBrownPercentage * 100)
    }
  };
}

/**
 * Generate care recommendations
 */
function generateRecommendations(growthStage, healthStatus, labels) {
  const recommendations = [];
  const stage = growthStage.stage;
  const health = healthStatus.level;

  // Stage-specific recommendations
  if (stage === 'Seedling') {
    recommendations.push('💧 Keep soil moist but not waterlogged');
    recommendations.push('💡 Provide 18-24 hours of light per day');
    recommendations.push('🌡️ Maintain temperature between 68-77°F (20-25°C)');
  } else if (stage === 'Vegetative') {
    recommendations.push('💧 Water when top inch of soil is dry');
    recommendations.push('💡 Provide 18 hours of light per day');
    recommendations.push('🌱 Begin nutrient feeding (nitrogen-rich)');
    recommendations.push('✂️ Consider topping or training techniques');
  } else if (stage === 'Flowering') {
    recommendations.push('💡 Switch to 12/12 light cycle');
    recommendations.push('🌱 Use bloom nutrients (phosphorus/potassium-rich)');
    recommendations.push('💧 Monitor humidity (40-50% ideal)');
    recommendations.push('🔍 Check trichomes weekly for harvest timing');
  } else if (stage.includes('Harvest')) {
    recommendations.push('✂️ Harvest when 70-90% of trichomes are cloudy');
    recommendations.push('🌡️ Dry in dark room at 60-70°F with 45-55% humidity');
    recommendations.push('⏱️ Cure in airtight jars for 2-4 weeks minimum');
  }

  // Health-specific recommendations
  if (health === 'critical') {
    recommendations.push('🚨 URGENT: Inspect for pests, mold, or disease immediately');
    recommendations.push('🔬 Consider isolating plant to prevent spread');
    recommendations.push('💊 May require treatment or removal of affected areas');
  } else if (health === 'warning') {
    recommendations.push('⚠️ Check pH levels (6.0-7.0 for soil, 5.5-6.5 for hydro)');
    recommendations.push('🌱 Review nutrient schedule - may need adjustment');
    recommendations.push('💨 Ensure proper air circulation');
  } else if (health === 'good') {
    recommendations.push('✅ Continue current care routine');
    recommendations.push('📊 Monitor regularly for any changes');
  }

  return recommendations;
}

/**
 * Calculate confidence score for the analysis
 */
function calculateConfidence(labels, growthStage, healthStatus) {
  // Higher confidence if we have more labels and clear indicators
  const labelCount = labels.length;
  const highScoreLabels = labels.filter(l => l.score > 0.8).length;
  
  let confidence = 0;
  
  // Base confidence from label count
  if (labelCount > 20) confidence += 30;
  else if (labelCount > 10) confidence += 20;
  else confidence += 10;
  
  // Confidence from high-score labels
  if (highScoreLabels > 10) confidence += 40;
  else if (highScoreLabels > 5) confidence += 30;
  else confidence += 15;
  
  // Confidence from clear stage identification
  if (growthStage.stage !== 'Unknown') confidence += 30;
  
  return Math.min(confidence, 95); // Cap at 95%
}

