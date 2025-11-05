import React from 'react';
import { View, StyleSheet, Image, ImageBackground } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, spacing } from '../config/theme';

export default function HomeScreen({ navigation }) {
  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1536964310528-e47dd655ecf3?w=1200' }}
      style={styles.background}
      blurRadius={3}
    >
      <LinearGradient
        colors={['rgba(18, 18, 18, 0.85)', 'rgba(18, 18, 18, 0.95)']}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>

          <Text variant="displaySmall" style={styles.title}>
            StrainSpotter
          </Text>
          
          <Text variant="titleMedium" style={styles.subtitle}>
            AI-Powered Cannabis Strain Identification
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Scan')}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              icon="camera"
            >
              Start AI Scan
            </Button>

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Garden')}
              style={styles.secondaryButton}
              contentStyle={styles.buttonContent}
              icon="spa"
            >
              Enter the Garden
            </Button>
          </View>

          <View style={styles.features}>
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>🌿</Text>
              <Text variant="bodyMedium" style={styles.featureText}>
                Identify strains instantly
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text variant="bodyMedium" style={styles.featureText}>
                Browse 35,000+ strains
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>⭐</Text>
              <Text variant="bodyMedium" style={styles.featureText}>
                Read community reviews
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceVariant,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.secondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  primaryButton: {
    marginBottom: spacing.md,
  },
  secondaryButton: {
    borderColor: theme.colors.primary,
  },
  buttonContent: {
    paddingVertical: spacing.md,
  },
  features: {
    width: '100%',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureText: {
    color: theme.colors.onSurface,
    flex: 1,
  },
});

