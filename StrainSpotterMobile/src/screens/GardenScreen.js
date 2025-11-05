import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { Card, Text, IconButton, FAB } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { supabase } from '../config/supabase';
import { theme, spacing } from '../config/theme';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import CreditBalance from '../components/CreditBalance';

export default function GardenScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [scansUsed, setScansUsed] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCreditData(session.access_token);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCreditData(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCreditData = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.getCredits}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.isUnlimited ? 999 : data.creditsRemaining || 0);
        setScansUsed(data.usedThisMonth || 0);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  // Real cannabis flower images from Leafly strain database
  const features = [
    {
      title: 'AI Scan',
      icon: 'camera',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Scan'),
      bgImage: 'https://images.leafly.com/flower-images/gg-4.jpg', // Gorilla Glue #4
    },
    {
      title: 'Strain Browser',
      icon: 'spa',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('StrainBrowser'),
      bgImage: 'https://images.leafly.com/flower-images/blue-dream.png', // Blue Dream
    },
    {
      title: 'Reviews Hub',
      icon: 'star',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Reviews'),
      bgImage: 'https://images.leafly.com/flower-images/purple-punch-fixed.jpg', // Purple Punch
    },
    {
      title: 'Dispensaries',
      icon: 'store',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Dispensaries'),
      bgImage: 'https://images.leafly.com/flower-images/og-kush.png', // OG Kush
    },
    {
      title: 'Seed Vendors',
      icon: 'flower',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('SeedVendors'),
      bgImage: 'https://images.leafly.com/flower-images/gelato.jpg', // Gelato
    },
    {
      title: 'Groups',
      icon: 'account-group',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Groups'),
      bgImage: 'https://images.leafly.com/flower-images/granddaddy-purple.png', // Granddaddy Purple
    },
  ];

  // Real cannabis flower images for stat boxes from Leafly
  const statImages = [
    'https://images.leafly.com/flower-images/gsc.png', // Scans - Girl Scout Cookies
    'https://leafly-public.imgix.net/strains/photos/HIhdYnYSQICmDZpoCnO1_Zkittlez.png', // Reviews - Zkittlez
    'https://images.leafly.com/flower-images/northern-lights.png', // Favorites - Northern Lights
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <ImageBackground
      source={require('../../assets/strainspotter-bg.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header with Blur */}
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
          <View>
            <Text variant="titleMedium" style={styles.headerTitle}>
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'The Garden'}
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              ✓ Member
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Credits')}>
            <CreditBalance />
          </TouchableOpacity>
          <IconButton
            icon="logout"
            iconColor={theme.colors.primary}
            size={20}
            onPress={handleLogout}
          />
        </View>
      </BlurView>

      {/* Feature Grid */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureCard}
              onPress={feature.onPress}
              activeOpacity={0.7}
            >
              <ImageBackground
                source={{ uri: feature.bgImage }}
                style={styles.featureImageBg}
                imageStyle={styles.featureImageStyle}
              >
                <View style={[styles.card, { borderColor: feature.color }]}>
                  <View style={styles.cardContent}>
                    <IconButton
                      icon={feature.icon}
                      iconColor={feature.color}
                      size={40}
                      style={styles.cardIcon}
                    />
                    <Text variant="titleSmall" style={styles.cardTitle}>
                      {feature.title}
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text variant="titleMedium" style={styles.statsTitle}>
            Your Stats
          </Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Credits', value: credits },
              { label: 'Scans', value: scansUsed },
              { label: 'Favorites', value: 0 }
            ].map((stat, index) => (
              <ImageBackground
                key={stat.label}
                source={{ uri: statImages[index] }}
                style={styles.statImageBg}
                imageStyle={styles.statImageStyle}
              >
                <View style={styles.statCard}>
                  <Text variant="headlineSmall" style={styles.statValue}>
                    {stat.value}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    {stat.label}
                  </Text>
                </View>
              </ImageBackground>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Feedback Button */}
      <FAB
        icon="message-text"
        style={styles.feedbackFab}
        onPress={() => {
          // TODO: Navigate to feedback screen or open feedback modal
          alert('Feedback feature coming soon!');
        }}
        color={theme.colors.onPrimary}
        size="small"
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
    overflow: 'hidden',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  featureCard: {
    width: '48%',
    marginBottom: spacing.md,
  },
  featureImageBg: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  featureImageStyle: {
    borderRadius: 16,
  },
  blurCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 2,
    borderRadius: 16,
    elevation: 0,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  cardIcon: {
    margin: 0,
  },
  cardTitle: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  statsContainer: {
    marginTop: spacing.lg,
  },
  statsTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statImageBg: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statImageStyle: {
    borderRadius: 12,
  },
  statBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  statCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
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
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  feedbackFab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 80,
    backgroundColor: theme.colors.secondary,
  },
});

