/**
 * Credit System Routes
 * 
 * Endpoints for managing scan credits:
 * - GET /api/credits/balance - Get user's credit balance
 * - GET /api/credits/history - Get transaction history
 * - POST /api/credits/purchase - Purchase credit top-up
 * - POST /api/credits/upgrade - Upgrade membership tier
 */

import express from 'express';
import * as scanCreditsV2 from '../services/scanCreditsV2.js';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

/**
 * GET /api/credits/balance
 * Get user's current credit balance and tier info
 */
router.get('/balance', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const summary = await scanCreditsV2.getCreditSummary(user.id);

    res.json({
      success: true,
      ...summary
    });
  } catch (e) {
    console.error('[credits/balance] Error:', e);
    res.status(500).json({ error: 'Failed to get credit balance' });
  }
});

/**
 * GET /api/credits/history
 * Get user's credit transaction history
 */
router.get('/history', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const history = await scanCreditsV2.getTransactionHistory(user.id, limit);

    res.json({
      success: true,
      transactions: history
    });
  } catch (e) {
    console.error('[credits/history] Error:', e);
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
});

/**
 * POST /api/credits/purchase
 * Purchase credit top-up
 * 
 * Body:
 * - package: 'small' | 'medium' | 'large' | 'xl'
 * - paymentMethodId: Stripe payment method ID
 */
router.post('/purchase', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { package: packageType, paymentMethodId } = req.body;

    // Define credit packages
    const packages = {
      small: { credits: 25, price: 100, name: '$1 - 25 scans' },      // $1.00 = 25 scans (78% margin)
      medium: { credits: 100, price: 300, name: '$3 - 100 scans' },   // $3.00 = 100 scans (71% margin)
      large: { credits: 200, price: 500, name: '$5 - 200 scans' },    // $5.00 = 200 scans (66% margin)
      xl: { credits: 500, price: 1000, name: '$10 - 500 scans' }      // $10.00 = 500 scans (57% margin)
    };

    if (!packages[packageType]) {
      return res.status(400).json({ error: 'Invalid package type' });
    }

    const selectedPackage = packages[packageType];

    // TODO: Integrate with Stripe payment processing
    // For now, just add credits (you'll need to add Stripe integration)
    
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method required' });
    }

    // Simulate payment success (replace with actual Stripe charge)
    const paymentSuccess = true;

    if (!paymentSuccess) {
      return res.status(402).json({ error: 'Payment failed' });
    }

    // Add credits to user account
    const result = await scanCreditsV2.addCredits(
      user.id,
      selectedPackage.credits,
      `Purchased ${selectedPackage.name}`
    );

    res.json({
      success: true,
      message: `Successfully purchased ${selectedPackage.credits} scan credits`,
      ...result
    });
  } catch (e) {
    console.error('[credits/purchase] Error:', e);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
});

/**
 * POST /api/credits/upgrade
 * Upgrade membership tier
 * 
 * Body:
 * - tier: 'member' | 'premium'
 * - paymentMethodId: Stripe payment method ID
 */
router.post('/upgrade', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { tier, paymentMethodId } = req.body;

    const validTiers = ['member', 'premium'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method required' });
    }

    // TODO: Integrate with Stripe subscription
    // For now, just upgrade tier (you'll need to add Stripe integration)

    const result = await scanCreditsV2.upgradeTier(user.id, tier);

    res.json({
      success: true,
      message: `Successfully upgraded to ${tier} tier`,
      ...result
    });
  } catch (e) {
    console.error('[credits/upgrade] Error:', e);
    res.status(500).json({ error: 'Failed to upgrade tier' });
  }
});

/**
 * GET /api/credits/packages
 * Get available credit packages
 */
router.get('/packages', async (req, res) => {
  res.json({
    success: true,
    packages: [
      { id: 'small', credits: 25, price: 1.00, priceInCents: 100, name: '$1 - 25 scans', perScanCost: 0.04 },
      { id: 'medium', credits: 100, price: 3.00, priceInCents: 300, name: '$3 - 100 scans', perScanCost: 0.03 },
      { id: 'large', credits: 200, price: 5.00, priceInCents: 500, name: '$5 - 200 scans', perScanCost: 0.025 },
      { id: 'xl', credits: 500, price: 10.00, priceInCents: 1000, name: '$10 - 500 scans', perScanCost: 0.02 }
    ],
    tiers: [
      { id: 'free', name: 'Free', price: 0, scans: 10, description: '10 scans lifetime' },
      { id: 'member', name: 'Member', price: 4.99, scans: 200, description: '200 scans/month' },
      { id: 'premium', name: 'Premium', price: 14.99, scans: 1200, description: '1200 scans/month' }
    ]
  });
});

export default router;

