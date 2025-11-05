import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Chip, Divider } from 'react-native-paper';
import { theme, spacing } from '../config/theme';

export default function StrainDetailScreen({ route }) {
  const { strain } = route.params || {};

  if (!strain) {
    return (
      <View style={styles.container}>
        <Text>Strain not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.name}>
            {strain.name}
          </Text>
          <Chip mode="outlined" style={styles.typeChip}>
            {strain.type}
          </Chip>
          
          <Divider style={styles.divider} />
          
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Description
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {strain.description || 'No description available'}
          </Text>

          {strain.effects && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Effects
              </Text>
              <Text variant="bodyMedium" style={styles.text}>
                {strain.effects}
              </Text>
            </>
          )}

          {strain.flavors && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Flavors
              </Text>
              <Text variant="bodyMedium" style={styles.text}>
                {strain.flavors}
              </Text>
            </>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
  },
  name: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  typeChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  description: {
    color: theme.colors.onSurface,
    lineHeight: 22,
  },
  text: {
    color: theme.colors.onSurface,
  },
});

