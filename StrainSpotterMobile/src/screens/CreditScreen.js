import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Surface, Chip } from 'react-native-paper';
import { theme, spacing } from '../config/theme';
import { supabase } from '../config/supabase';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

export default function CreditScreen() {
  const [loading, setLoading] = useState(true);
  const [creditData, setCreditData] = useState(null);
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCreditData();
    fetchPackages();
  }, []);

  const fetchCreditData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Please sign in to view credits');
        setLoading(false);
        return;
      }

      // Fetch credit balance from backend
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.getCredits}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();
      setCreditData(data);
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.getPackages}`);
      const data = await response.json();
      setPackages(data.packages || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading credits...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchCreditData} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Credit Balance Card */}
      <Card style={styles.balanceCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.balanceLabel}>
            Your Scan Credits
          </Text>
          <Text variant="displayMedium" style={styles.balanceValue}>
            {creditData?.isUnlimited ? '∞' : creditData?.creditsRemaining || 0}
          </Text>
          <View style={styles.tierContainer}>
            <Chip
              mode="flat"
              style={[styles.tierChip, { backgroundColor: getTierColor(creditData?.tier) }]}
              textStyle={styles.tierText}
            >
              {getTierName(creditData?.tier)}
            </Chip>
          </View>
          {!creditData?.isUnlimited && (
            <Text variant="bodySmall" style={styles.limitText}>
              Monthly Limit: {creditData?.monthlyLimit || 0} scans
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Stats Card */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Usage Stats
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>
                {creditData?.usedThisMonth || 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Used This Month
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>
                {creditData?.lifetimeScansUsed || 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Lifetime Scans
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Top-up Packages */}
      {packages.length > 0 && !creditData?.isUnlimited && (
        <View style={styles.packagesSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Buy More Credits
          </Text>
          {packages.map((pkg) => (
            <Card key={pkg.id} style={styles.packageCard}>
              <Card.Content>
                <View style={styles.packageHeader}>
                  <View>
                    <Text variant="titleMedium" style={styles.packageName}>
                      {pkg.credits} Scans
                    </Text>
                    <Text variant="bodySmall" style={styles.packagePrice}>
                      ${pkg.price.toFixed(2)} (${pkg.perScanCost.toFixed(3)}/scan)
                    </Text>
                  </View>
                  <Button
                    mode="contained"
                    onPress={() => alert('Payment integration coming soon!')}
                    style={styles.buyButton}
                  >
                    Buy
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Refresh Button */}
      <Button
        mode="outlined"
        onPress={fetchCreditData}
        style={styles.refreshButton}
        icon="refresh"
      >
        Refresh Balance
      </Button>
    </ScrollView>
  );
}

function getTierName(tier) {
  const names = {
    free: 'Free',
    member: 'Member',
    premium: 'Premium',
    admin: 'Admin (Unlimited)',
  };
  return names[tier] || 'Unknown';
}

function getTierColor(tier) {
  const colors = {
    free: '#64748b',
    member: '#7CB342',
    premium: '#FFB300',
    admin: '#E91E63',
  };
  return colors[tier] || '#64748b';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: theme.colors.onSurface,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
  },
  balanceCard: {
    margin: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  balanceLabel: {
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  balanceValue: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  tierContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  tierChip: {
    alignSelf: 'flex-start',
  },
  tierText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  limitText: {
    color: theme.colors.onSurface,
    opacity: 0.6,
    marginTop: spacing.sm,
  },
  statsCard: {
    margin: spacing.md,
    marginTop: 0,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  packagesSection: {
    margin: spacing.md,
    marginTop: spacing.lg,
  },
  packageCard: {
    marginTop: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageName: {
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  packagePrice: {
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  buyButton: {
    minWidth: 80,
  },
  refreshButton: {
    margin: spacing.md,
    marginTop: spacing.lg,
    borderColor: theme.colors.primary,
  },
});

