import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

// Starter free scans for non-members
const STARTER_FREE_SCANS = 20;
// Included scans for members
const MEMBER_SCAN_CAP = 150;

// localStorage keys
const MEMBER_KEY = 'strainspotter_is_member';
const STARTER_USED_KEY = 'strainspotter_starter_scans_used';
const EXTRA_CREDITS_KEY = 'strainspotter_extra_scan_credits';
const MEMBER_USED_KEY = 'strainspotter_member_scans_used';

// Example top-up packs (credits = scans added)
// Real IAP SKUs will be wired on native side.
export const TOPUP_PACKS = [
  { id: 'pack_20', label: '20 scans', credits: 20 },
  { id: 'pack_50', label: '50 scans', credits: 50 },
  { id: 'pack_100', label: '100 scans', credits: 100 },
];

const MembershipContext = createContext(null);

export function MembershipProvider({ children }) {
  const [initialized, setInitialized] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [starterUsed, setStarterUsed] = useState(0); // non-member starter pool usage
  const [extraCredits, setExtraCredits] = useState(0); // purchased top-ups
  const [memberUsed, setMemberUsed] = useState(0); // member's included 150 usage

  // Load from storage
  useEffect(() => {
    try {
      const storedMember = localStorage.getItem(MEMBER_KEY);
      const storedStarter = localStorage.getItem(STARTER_USED_KEY);
      const storedExtra = localStorage.getItem(EXTRA_CREDITS_KEY);
      const storedMemberUsed = localStorage.getItem(MEMBER_USED_KEY);

      if (storedMember === 'true') {
        setIsMember(true);
      }
      if (storedStarter != null) {
        const n = parseInt(storedStarter, 10);
        if (!Number.isNaN(n) && n >= 0) setStarterUsed(n);
      }
      if (storedExtra != null) {
        const n = parseInt(storedExtra, 10);
        if (!Number.isNaN(n) && n >= 0) setExtraCredits(n);
      }
      if (storedMemberUsed != null) {
        const n = parseInt(storedMemberUsed, 10);
        if (!Number.isNaN(n) && n >= 0) setMemberUsed(n);
      }
    } catch {
      // ignore
    } finally {
      setInitialized(true);
    }
  }, []);

  const persistMember = useCallback((next) => {
    setIsMember(next);
    try {
      localStorage.setItem(MEMBER_KEY, next ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, []);

  const persistStarterUsed = useCallback((next) => {
    setStarterUsed(next);
    try {
      localStorage.setItem(STARTER_USED_KEY, String(next));
    } catch {
      // ignore
    }
  }, []);

  const persistExtraCredits = useCallback((next) => {
    setExtraCredits(next);
    try {
      localStorage.setItem(EXTRA_CREDITS_KEY, String(next));
    } catch {
      // ignore
    }
  }, []);

  const persistMemberUsed = useCallback((next) => {
    setMemberUsed(next);
    try {
      localStorage.setItem(MEMBER_USED_KEY, String(next));
    } catch {
      // ignore
    }
  }, []);

  // Derived pools
  const starterRemaining = Math.max(0, STARTER_FREE_SCANS - starterUsed);
  const memberRemaining = Math.max(0, MEMBER_SCAN_CAP - memberUsed);

  // Total available scans depends on membership:
  // - Non-member: 20 starter + top-ups
  // - Member: 150 included + top-ups
  const totalAvailableScans = isMember
    ? memberRemaining + extraCredits
    : starterRemaining + extraCredits;

  // Called when a scan successfully completes.
  const registerScanConsumed = useCallback(() => {
    if (isMember) {
      // Members: use purchased credits first, then their 150-pack.
      if (extraCredits > 0) {
        const nextExtra = Math.max(0, extraCredits - 1);
        persistExtraCredits(nextExtra);
      } else if (memberRemaining > 0) {
        const used = memberUsed + 1;
        persistMemberUsed(used);
      }
    } else {
      // Non-members: use purchased credits first, then 20 starter scans.
      if (extraCredits > 0) {
        const nextExtra = Math.max(0, extraCredits - 1);
        persistExtraCredits(nextExtra);
      } else if (starterRemaining > 0) {
        const used = starterUsed + 1;
        persistStarterUsed(used);
      }
    }
  }, [
    isMember,
    extraCredits,
    starterRemaining,
    memberRemaining,
    starterUsed,
    memberUsed,
    persistExtraCredits,
    persistStarterUsed,
    persistMemberUsed,
  ]);

  // Emphasized path: user becomes member (native IAP will call this).
  const markMember = useCallback(() => {
    persistMember(true);
  }, [persistMember]);

  // Dev helper or logout-like reset
  const resetMembership = useCallback(() => {
    persistMember(false);
    persistStarterUsed(0);
    persistExtraCredits(0);
    persistMemberUsed(0);
  }, [persistMember, persistStarterUsed, persistExtraCredits, persistMemberUsed]);

  // Top-up credits (when native IAP confirms purchase)
  const applyTopupCredits = useCallback(
    (credits) => {
      if (!credits || credits <= 0) return;
      const next = extraCredits + credits;
      persistExtraCredits(next);
    },
    [extraCredits, persistExtraCredits]
  );

  // Placeholder hooks for native purchases:
  // In the real app, these will call into iOS/Android IAP,
  // then call markMember/applyTopupCredits on success.
  const requestMembershipPurchase = useCallback(() => {
    console.log('[Membership] requestMembershipPurchase() – hook for native IAP');
    // DEV: for now, just flip to member so it's testable
    markMember();
  }, [markMember]);

  const requestTopupPurchase = useCallback(
    (packId) => {
      console.log(
        '[Membership] requestTopupPurchase() – hook for native IAP, packId=',
        packId
      );
      const pack = TOPUP_PACKS.find((p) => p.id === packId);
      if (!pack) return;
      // DEV: just apply immediately so top-ups can be tested in the UI
      applyTopupCredits(pack.credits);
    },
    [applyTopupCredits]
  );

  const value = {
    initialized,
    isMember,
    starterUsed,
    starterRemaining,
    memberUsed,
    memberRemaining,
    memberCap: MEMBER_SCAN_CAP,
    extraCredits,
    totalAvailableScans,
    starterCap: STARTER_FREE_SCANS,
    markMember,
    resetMembership,
    registerScanConsumed,
    applyTopupCredits,
    requestMembershipPurchase,
    requestTopupPurchase,
    topupPacks: TOPUP_PACKS,
  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const ctx = useContext(MembershipContext);
  if (!ctx) {
    throw new Error('useMembership must be used within MembershipProvider');
  }
  return ctx;
}
