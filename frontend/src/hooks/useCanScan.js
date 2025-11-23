import { useCreditBalance } from './useCreditBalance';

/**
 * Shared hook for determining if user can scan
 * Used by both ScanPage (standalone) and ScanWizard (inside Garden)
 */
export function useCanScan() {
  const { summary, isFounder, canScan: canScanFromHook } = useCreditBalance();
  
  // Safe remaining scans calculation
  const remainingScans = isFounder 
    ? Number.POSITIVE_INFINITY 
    : (summary?.remainingScans ?? summary?.creditsRemaining ?? 0);
  
  const safeRemaining = Number.isFinite(remainingScans) 
    ? remainingScans 
    : Number.POSITIVE_INFINITY;

  // Founders can always scan, otherwise check remaining scans
  const canScan = isFounder || safeRemaining > 0 || canScanFromHook;

  return {
    canScan,
    remainingScans: safeRemaining,
    isFounder: Boolean(isFounder),
    summary,
  };
}

