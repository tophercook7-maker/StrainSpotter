import React, { useState } from 'react';
import { verifySubscription } from '../lib/membership';

// Props: supabase, onSuccess(), onCancel()
export default function MembershipSignup({ supabase, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleApplePay() {
    setLoading(true);
    setError(null);
    try {
      // Trigger Apple in-app purchase (requires Capacitor + @capacitor-community/in-app-purchases)
      // Example: const result = await InAppPurchases.purchaseProduct({ productId: 'strainspotter_club_monthly' });
      // For now, placeholder:
      const mockReceipt = 'APPLE_RECEIPT_TOKEN_FROM_IAP';
      
      // Verify with backend
      const result = await verifySubscription({
        payload: { platform: 'apple', receipt: mockReceipt },
        supabase
      });
      
      if (result.status === 'active') {
        onSuccess?.();
      } else {
        throw new Error('Subscription verification failed');
      }
    } catch (e) {
      setError(e.message || 'Apple Pay failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGooglePay() {
    setLoading(true);
    setError(null);
    try {
      // Trigger Google Play billing (requires Capacitor + @capacitor-community/in-app-purchases)
      // Example: const result = await InAppPurchases.purchaseProduct({ productId: 'strainspotter_club_monthly' });
      const mockToken = 'GOOGLE_PURCHASE_TOKEN_FROM_IAP';
      
      // Verify with backend
      const result = await verifySubscription({
        payload: { platform: 'google', purchaseToken: mockToken },
        supabase
      });
      
      if (result.status === 'active') {
        onSuccess?.();
      } else {
        throw new Error('Subscription verification failed');
      }
    } catch (e) {
      setError(e.message || 'Google Pay failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'white',
        padding: 32,
        borderRadius: 16,
        maxWidth: 400,
        width: '90%',
        textAlign: 'center'
      }}>
        <h2>Join StrainSpotter Club</h2>
        <p>Unlock 200 scans per month, advanced strain matching, and exclusive features.</p>
        <p style={{ fontSize: 24, fontWeight: 'bold', margin: '16px 0' }}>$4.99/month</p>
        
        <button
          onClick={handleApplePay}
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 12,
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          {loading ? 'Processing…' : 'Pay with Apple Pay'}
        </button>
        
        <button
          onClick={handleGooglePay}
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 12,
            background: '#4285F4',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          {loading ? 'Processing…' : 'Pay with Google Pay'}
        </button>
        
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            background: 'transparent',
            color: '#666',
            border: 'none',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Maybe later
        </button>
        
        {error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
}
