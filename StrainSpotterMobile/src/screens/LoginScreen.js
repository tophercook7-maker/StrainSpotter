import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, TextInput, Snackbar } from 'react-native-paper';
import { supabase } from '../config/supabase';
import { theme, spacing } from '../config/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showMessage = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      showMessage('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        showMessage('Check your email for verification link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      showMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text variant="headlineLarge" style={styles.title}>
          {isSignUp ? 'Join the Garden' : 'Welcome Back'}
        </Text>
        
        <Text variant="bodyMedium" style={styles.subtitle}>
          {isSignUp
            ? 'Create your account to start identifying strains'
            : 'Sign in to continue your journey'}
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
          />

          <Button
            mode="contained"
            onPress={handleAuth}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          <Button
            mode="text"
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={loading}
            style={styles.switchButton}
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Button>
        </View>

        <View style={styles.features}>
          <Text variant="titleMedium" style={styles.featuresTitle}>
            ✨ What You Get:
          </Text>
          <Text variant="bodyMedium" style={styles.featureItem}>
            🌿 AI-powered strain identification
          </Text>
          <Text variant="bodyMedium" style={styles.featureItem}>
            📊 10 free scans to start
          </Text>
          <Text variant="bodyMedium" style={styles.featureItem}>
            🔍 Browse 1000+ strain database
          </Text>
          <Text variant="bodyMedium" style={styles.featureItem}>
            ⭐ Read and write reviews
          </Text>
          <Text variant="bodyMedium" style={styles.featureItem}>
            📍 Find nearby dispensaries
          </Text>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.xl,
    opacity: 0.8,
  },
  form: {
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  button: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  switchButton: {
    marginTop: spacing.sm,
  },
  features: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  featuresTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  featureItem: {
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
});

