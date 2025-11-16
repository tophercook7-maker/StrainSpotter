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
import { supabaseAdmin } from '../supabaseAdmin.js';

const router = express.Router();

const USD = 'usd';
const MODERATOR_DISCOUNT_RATE = 0.2; // 20% off for moderators

const BASE_PACKAGE_DEFINITIONS = [
  {
    id: 'app_purchase',
    type: 'app_purchase',
    label: 'App Purchase',
    description: 'One-time unlock with 20 starter scans.',
    scans: 20,
    recurring: false,
    price: 5.99,
    currency: USD,
    allowModeratorDiscount: false,
    perks: [
      'Includes 20 AI scans',
      'Unlocks Garden, Groups, and Grower tools'
    ]
  },
  {
    id: 'monthly_member',
    type: 'membership',
    label: 'Monthly Member',
    description: '200 scans per month plus community perks.',
    scansPerMonth: 200,
    recurring: true,
    price: 4.99,
    currency: USD,
    allowModeratorDiscount: true,
    perks: [
      '200 AI scans refreshed monthly',
      'Priority access to new features',
      'Support for feedback + moderator tools'
    ]
  },
  {
    id: 'top_up_50',
    type: 'top_up',
    label: 'Top-up 50',
    description: 'Add 50 on-demand scans.',
    credits: 50,
    recurring: false,
    price: 4.99,
    currency: USD,
    allowModeratorDiscount: true
  },
  {
    id: 'top_up_200',
    type: 'top_up',
    label: 'Top-up 200',
    description: 'Add 200 on-demand scans.',
    credits: 200,
    recurring: false,
    price: 9.99,
    currency: USD,
    allowModeratorDiscount: true
  },
  {
    id: 'top_up_500',
    type: 'top_up',
    label: 'Top-up 500',
    description: 'Add 500 on-demand scans.',
    credits: 500,
    recurring: false,
    price: 19.99,
    currency: USD,
    allowModeratorDiscount: true
  }
];

function enrichPackage(pkg, role) {
  const priceInCents = Math.round(pkg.price * 100);
  const enriched = {
    ...pkg,
    priceInCents,
    effectivePrice: pkg.price,
    effectivePriceInCents: priceInCents,
    moderatorDiscount: null
  };

  if (role === 'moderator' && pkg.allowModeratorDiscount) {
    const discountedPrice = Number((pkg.price * (1 - MODERATOR_DISCOUNT_RATE)).toFixed(2));
    const discountedPriceInCents = Math.round(discountedPrice * 100);
    enriched.moderatorDiscount = {
      percent: MODERATOR_DISCOUNT_RATE * 100,
      originalPrice: pkg.price,
      originalPriceInCents: priceInCents,
      discountedPrice,
      discountedPriceInCents
    };
    enriched.effectivePrice = discountedPrice;
    enriched.effectivePriceInCents = discountedPriceInCents;
  }

  return enriched;
}

function getPackageDefinitionById(id) {
  return BASE_PACKAGE_DEFINITIONS.find(pkg => pkg.id === id);
}

async function getUserContext(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, profile: null };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { user: null, profile: null };
  }

  const profileClient = supabaseAdmin ?? supabase;
  let profile = null;
  try {
    const { data, error: profileError } = await profileClient
      .from('profiles')
      .select('user_id, role, membership_tier')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!profileError) {
      profile = data;
    }
  } catch (e) {
    console.warn('[credits] Failed to fetch profile for pricing:', e.message);
  }

  return { user, profile };
}

/**
 * GET /api/credits/balance
 * Get user's current credit balance and tier info
 */
router.get('/balance', async (req, res) => {
  try {
    const { user } = await getUserContext(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
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
    const { user } = await getUserContext(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
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
    const { user, profile } = await getUserContext(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { packageId, paymentMethodId } = req.body;
    if (!packageId) {
      return res.status(400).json({ error: 'packageId is required' });
    }

    const packageDefinition = getPackageDefinitionById(packageId);
    if (!packageDefinition) {
      return res.status(400).json({ error: 'Unknown package requested' });
    }

    if (packageDefinition.type !== 'top_up') {
      return res.status(400).json({ error: 'Only top-up packages can be purchased here.' });
    }

    // TODO: Integrate with Stripe/StoreKit/Play Billing.
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method required' });
    }

    const creditsToAdd = packageDefinition.credits;
    const result = await scanCreditsV2.addCredits(
      user.id,
      creditsToAdd,
      `Purchased ${packageDefinition.label}`
    );

    const enrichedPackage = enrichPackage(packageDefinition, profile?.role);

    res.json({
      success: true,
      message: `Purchased ${creditsToAdd} scan credits`,
      ...result,
      package: enrichedPackage
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
    const { user } = await getUserContext(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { tier, paymentMethodId } = req.body;

    const validTiers = ['app_purchase', 'monthly_member'];
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
  try {
    const { profile } = await getUserContext(req);
    const role = profile?.role || null;
    const packages = BASE_PACKAGE_DEFINITIONS.map(pkg => enrichPackage(pkg, role));

    res.json({
      success: true,
      role,
      packages
    });
  } catch (e) {
    console.error('[credits/packages] Error:', e);
    res.status(500).json({ error: 'Failed to load pricing packages' });
  }
});

export default router;

