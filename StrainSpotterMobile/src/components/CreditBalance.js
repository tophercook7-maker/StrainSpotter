import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../config/supabase';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { theme, customColors } from '../config/theme';

export default function CreditBalance() {
  const [credits, setCredits] = useState(null);
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.getCredits}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.creditsRemaining);
        setTier(data.tier);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColor = () => {
    if (tier === 'admin') return customColors.creditChip.admin;
    if (credits === 0) return customColors.creditChip.error;
    if (credits <= 5) return customColors.creditChip.warning;
    return customColors.creditChip.success;
  };

  const getLabel = () => {
    if (tier === 'admin') return '∞ Scans';
    return `${credits} Scans`;
  };

  if (loading) {
    return <ActivityIndicator size="small" color={theme.colors.primary} />;
  }

  return (
    <Chip
      icon="lightning-bolt"
      style={[styles.chip, { backgroundColor: getColor() + '20', borderColor: getColor() }]}
      textStyle={[styles.chipText, { color: getColor() }]}
    >
      {getLabel()}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
  },
  chipText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
});

