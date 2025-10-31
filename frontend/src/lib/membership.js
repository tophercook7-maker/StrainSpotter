
// Membership helpers: only two levels (basic and member)
// Membership flag stored on user metadata: user.user_metadata.membership === 'club'

export async function getMembershipStatus({ supabase }) {
  let isMember = false;
  let membership = 'none';
  let userId = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      membership = user.user_metadata?.membership || 'none';
      isMember = membership === 'club';
    }
  } catch (e) {
    console.debug('[membership] getUser failed', e);
  }
  return { isMember, membership, userId };
}
export function canScanNow(status) {
  if (status.isMember) return true;
  return status.trialRemaining > 0;
}

export function trialCtaText(status) {
  if (status.isMember) return 'Scan now';
  if (status.trialRemaining <= 0) return 'Join StrainSpotter Club to keep scanning';
  return `Try Me (${status.trialRemaining} left)`;
}
