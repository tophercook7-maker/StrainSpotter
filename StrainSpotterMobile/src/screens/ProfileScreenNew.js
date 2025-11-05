import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, Avatar, List, Divider, Switch, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../config/supabase';
import { theme, spacing } from '../config/theme';

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch profile from Supabase
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={user?.email?.charAt(0).toUpperCase() || '?'}
            style={styles.avatar}
          />
          <Text variant="headlineSmall" style={styles.email}>
            {user?.email}
          </Text>
          <Text variant="bodyMedium" style={styles.memberSince}>
            Member since {new Date(user?.created_at).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text variant="headlineMedium" style={styles.statValue}>
            {profile?.scan_credits || 0}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            Credits
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text variant="headlineMedium" style={styles.statValue}>
            0
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            Scans
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text variant="headlineMedium" style={styles.statValue}>
            0
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            Reviews
          </Text>
        </View>
      </View>

      {/* Settings */}
      <Text variant="titleLarge" style={styles.sectionTitle}>
        Settings
      </Text>

      <Card style={styles.settingsCard}>
        <List.Item
          title="Push Notifications"
          description="Get notified about scan results"
          left={props => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              color={theme.colors.primary}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Offline Mode"
          description="Cache strains for offline access"
          left={props => <List.Icon {...props} icon="cloud-off" />}
          right={() => (
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              color={theme.colors.primary}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Scan Credits"
          description="Manage your scan credits"
          left={props => <List.Icon {...props} icon="lightning-bolt" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Credits')}
        />
      </Card>

      {/* Account Actions */}
      <Text variant="titleLarge" style={styles.sectionTitle}>
        Account
      </Text>

      <Card style={styles.actionsCard}>
        <List.Item
          title="Change Password"
          left={props => <List.Icon {...props} icon="lock" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => alert('Password change coming soon!')}
        />
        <Divider />
        <List.Item
          title="Privacy Policy"
          left={props => <List.Icon {...props} icon="shield-check" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => alert('Privacy policy coming soon!')}
        />
        <Divider />
        <List.Item
          title="Terms of Service"
          left={props => <List.Icon {...props} icon="file-document" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => alert('Terms of service coming soon!')}
        />
      </Card>

      {/* Logout Button */}
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor={theme.colors.error}
        icon="logout"
      >
        Logout
      </Button>

      {/* App Version */}
      <Text variant="bodySmall" style={styles.version}>
        StrainSpotter v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.lg,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginBottom: spacing.md,
  },
  email: {
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  memberSince: {
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline,
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
  sectionTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  settingsCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.lg,
  },
  actionsCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.lg,
  },
  logoutButton: {
    marginBottom: spacing.md,
    borderColor: theme.colors.error,
  },
  version: {
    color: theme.colors.onSurface,
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});

