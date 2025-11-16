import { supabase } from '../supabaseClient';
import { API_BASE } from '../config';

export async function logEvent(eventName, context = {}) {
  try {
    let token = null;
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
    }

    await fetch(`${API_BASE}/api/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        event_name: eventName,
        context,
        platform: navigator?.userAgentData?.platform || navigator?.platform || 'unknown',
        session_id: localStorage.getItem('ss-session-id')
      })
    });
  } catch (err) {
    console.warn('[analytics] Failed to send event', eventName, err);
  }
}

