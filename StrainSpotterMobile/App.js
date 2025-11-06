import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { theme } from './src/config/theme';
import { supabase } from './src/config/supabase';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/screens/LoadingScreen';
import { initializeDatabase } from './src/services/offlineStorage';
import { registerForPushNotificationsAsync } from './src/services/notificationService';

// Check for OTA updates
async function checkForUpdates() {
  try {
    // Only check for updates if not in development and updates are enabled
    if (!Updates.isEnabled) {
      console.log('⚠️ Updates not enabled (development mode or not configured)');
      return;
    }

    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      console.log('📥 Update available! Downloading...');
      await Updates.fetchUpdateAsync();
      console.log('✅ Update downloaded! Reloading...');
      await Updates.reloadAsync();
    } else {
      console.log('✅ App is up to date');
    }
  } catch (error) {
    console.error('⚠️ Update check failed (non-critical):', error);
  }
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
          <Text style={styles.errorHint}>Please restart the app</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🌿 Initializing StrainSpotter...');
        console.log('Environment:', __DEV__ ? 'Development' : 'Production');

        // Check for OTA updates (non-blocking)
        if (!__DEV__) {
          checkForUpdates().catch(err => {
            console.warn('Update check failed:', err);
          });
        }

        // Initialize offline database with timeout (non-critical)
        console.log('Initializing database...');
        try {
          const dbTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database initialization timeout')), 5000)
          );
          await Promise.race([initializeDatabase(), dbTimeout]);
          console.log('✅ Database initialized');
        } catch (dbError) {
          console.warn('⚠️ Database initialization failed (non-critical):', dbError);
          // Continue without database - app will still work
        }

        // Register for push notifications (non-blocking)
        console.log('Registering for push notifications...');
        registerForPushNotificationsAsync().catch(err => {
          console.warn('Push notifications not available:', err);
        });

        // Get initial session
        console.log('Loading session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
        }
        setSession(session);
        console.log('✅ Session loaded:', session ? 'Logged in' : 'Not logged in');

        console.log('✅ App initialization complete!');
        setLoading(false);
      } catch (err) {
        console.error('❌ Initialization error:', err);
        console.error('Error stack:', err.stack);
        setError(err.message || 'Unknown error occurred');
        setLoading(false);
      }
    };

    initializeApp();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      setSession(session);
    });

    // Listen for notifications
    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
      });
    } catch (err) {
      console.warn('Notification listeners not available:', err);
    }

    return () => {
      subscription.unsubscribe();
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Initialization Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>Please check your internet connection and restart</Text>
      </View>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator session={session} />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff5252',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});
