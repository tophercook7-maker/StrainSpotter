import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { Button, Text, Checkbox } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing } from '../config/theme';

export default function AgeVerificationScreen({ navigation }) {
  const [checked, setChecked] = useState(false);

  const handleVerify = async () => {
    if (checked) {
      await AsyncStorage.setItem('ageVerified', 'true');
      navigation.replace('Login');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      
      <Text variant="headlineLarge" style={styles.title}>
        StrainSpotter
      </Text>
      
      <Text variant="titleMedium" style={styles.subtitle}>
        AI-Powered Cannabis Strain Identification
      </Text>

      <View style={styles.warningBox}>
        <Text variant="headlineSmall" style={styles.warningTitle}>
          ⚠️ Age Verification Required
        </Text>
        
        <Text variant="bodyMedium" style={styles.warningText}>
          This application contains information about cannabis products.
        </Text>
        
        <Text variant="bodyMedium" style={styles.warningText}>
          You must be 21 years or older to use this app.
        </Text>
      </View>

      <View style={styles.checkboxContainer}>
        <Checkbox
          status={checked ? 'checked' : 'unchecked'}
          onPress={() => setChecked(!checked)}
          color={theme.colors.primary}
        />
        <Text variant="bodyLarge" style={styles.checkboxLabel}>
          I am 21 years of age or older
        </Text>
      </View>

      <Button
        mode="contained"
        onPress={handleVerify}
        disabled={!checked}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Enter StrainSpotter
      </Button>

      <Text variant="bodySmall" style={styles.disclaimer}>
        By entering, you agree to our Terms of Service and Privacy Policy.
        This app is for educational and informational purposes only.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: spacing.lg,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderWidth: 2,
    borderColor: '#FF9800',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    width: '100%',
  },
  warningTitle: {
    color: '#FF9800',
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  warningText: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  checkboxLabel: {
    color: theme.colors.onSurface,
    marginLeft: spacing.sm,
    flex: 1,
  },
  button: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  disclaimer: {
    color: theme.colors.onSurface,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});

