// Stripe webhook handler for updating user subscription status
// Place in backend/routes/stripeWebhook.js

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Map Stripe price IDs to subscription tiers
function getTierByPriceId(priceId) {
  switch (priceId) {
    case process.env.STRIPE_PRICE_SCAN:
      return 'scan';
    case process.env.STRIPE_PRICE_FULL_MONTHLY:
    case process.env.STRIPE_PRICE_FULL_YEARLY:
      return 'full';
    default:
      return null;
  }
}

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email;
    const priceId = session.display_items ? session.display_items[0].price.id : (session.subscription && session.subscription.items.data[0].price.id);
    const tier = getTierByPriceId(priceId);
    const expiry = tier === 'full' && priceId === process.env.STRIPE_PRICE_FULL_YEARLY
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (email && tier) {
      await supabase.from('users').update({ subscription_tier: tier, subscription_expiry: expiry }).eq('email', email);
    }
  }
  res.json({ received: true });
});

module.exports = router;
