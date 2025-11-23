import { useCreditBalance } from './useCreditBalance';
import { useProMode } from '../contexts/ProModeContext';

/**
 * Shared hook for determining if user can scan
 * Used by both ScanPage (standalone) and ScanWizard (inside Garden)
 */
export function useCanScan() {
  const { remainingScans, isUnlimited, loading, error } = useCreditBalance();
  const { isFounder, founderUnlimitedEnabled } = useProMode();
  
  // Safe remaining scans calculation
  const safeRemaining = Number.isFinite(remainingScans) 
    ? remainingScans 
    : (isUnlimited ? Number.POSITIVE_INFINITY : 0);
  
  // Founders can always scan, otherwise check remaining scans
  const canScan = (isFounder && founderUnlimitedEnabled) || isUnlimited || safeRemaining > 0;

  return {
    canScan,
    remainingScans: safeRemaining,
    isFounder: Boolean(isFounder && founderUnlimitedEnabled), // Only true if both are true
    summary: { remainingScans: safeRemaining, isUnlimited: isUnlimited || (isFounder && founderUnlimitedEnabled) },
    loading,
    error,
  };
}
