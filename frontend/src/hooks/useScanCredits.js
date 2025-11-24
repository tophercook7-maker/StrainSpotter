import { useCreditBalance } from './useCreditBalance';
import { useProMode } from '../contexts/ProModeContext';
import { useAuth } from './useAuth';

/**
 * Normalized hook for scan credits that returns consistent shape
 * Returns: { isFounder, remainingScans, canScan }
 */
export function useScanCredits() {
  const { remainingScans, isUnlimited, loading } = useCreditBalance();
  const { isFounder, founderUnlimitedEnabled } = useProMode();
  const { user, session } = useAuth();
  
  // Detect guest (no user or session)
  const isGuest = !user && !session;
  
  // Normalize founder status
  const isFounderNormalized = Boolean(isFounder && founderUnlimitedEnabled);
  
  // Normalize remaining scans - founders get Infinity, guests get 20
  let remainingScansNormalized = remainingScans ?? null;
  if (isFounderNormalized) {
    remainingScansNormalized = Infinity;
  } else if (isGuest) {
    remainingScansNormalized = 20;
  }
  
  // Determine if user can scan - guests can always scan (they have 20 free)
  const canScan = isFounderNormalized || isGuest || (remainingScansNormalized ?? 0) > 0;
  
  return {
    isFounder: isFounderNormalized,
    remainingScans: remainingScansNormalized,
    canScan,
    loading,
    isGuest,
  };
}

