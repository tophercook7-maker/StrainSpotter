import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { theme } from '../config/theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text variant="headlineMedium" style={styles.title}>
        StrainSpotter
      </Text>
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      <Text variant="bodyMedium" style={styles.subtitle}>
        Loading your garden...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  subtitle: {
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
});

