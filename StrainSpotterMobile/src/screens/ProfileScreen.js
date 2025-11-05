import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../config/theme';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.text}>
        Profile
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Coming soon...
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
  text: {
    color: theme.colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
});
