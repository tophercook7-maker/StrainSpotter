import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE } from '../config.js';

const ProModeContext = createContext(null);

export function ProModeProvider({ children }) {
  const [proRole, setProRole] = useState(null);           // 'dispensary' | 'grower' | null
  const [proEnabled, setProEnabled] = useState(false);
  const [proLoading, setProLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('strainspotter_pro_mode');
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (parsed && (parsed.proRole === 'dispensary' || parsed.proRole === 'grower')) {
        setProRole(parsed.proRole);
        setProEnabled(!!parsed.proEnabled);
      }
    } catch (e) {
      console.warn('[ProMode] Failed to parse local storage', e);
    }
  }, []);

  function persist(next) {
    try {
      localStorage.setItem('strainspotter_pro_mode', JSON.stringify(next));
    } catch (e) {
      console.warn('[ProMode] Failed to persist', e);
    }
  }

  async function activateProWithCode(code) {
    setProLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/pro/validate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let errorMessage = 'Invalid access code. Please check and try again.';
        try {
          const errorData = JSON.parse(text);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Use default error message
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data.ok || !data.role) {
        throw new Error('Invalid response from server.');
      }

      setProRole(data.role);
      setProEnabled(true);
      persist({ proRole: data.role, proEnabled: true });

      return { ok: true, role: data.role };
    } catch (err) {
      console.error('[ProMode] activateProWithCode error', err);
      throw err;
    } finally {
      setProLoading(false);
    }
  }

  function clearProMode() {
    setProRole(null);
    setProEnabled(false);
    persist({ proRole: null, proEnabled: false });
  }

  const value = {
    proRole,
    proEnabled,
    proLoading,
    activateProWithCode,
    clearProMode
  };

  return (
    <ProModeContext.Provider value={value}>
      {children}
    </ProModeContext.Provider>
  );
}

export function useProMode() {
  const ctx = useContext(ProModeContext);
  if (!ctx) throw new Error('useProMode must be used within ProModeProvider');
  return ctx;
}

