import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from '../config/theme';

// Auth Screens
import AgeVerificationScreen from '../screens/AgeVerificationScreen';
import LoginScreen from '../screens/LoginScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import GardenScreen from '../screens/GardenScreen';
import ScanScreen from '../screens/ScanScreen';
import StrainBrowserScreen from '../screens/StrainBrowserScreen';
import StrainDetailScreen from '../screens/StrainDetailScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import DispensaryFinderScreen from '../screens/DispensaryFinderScreen';
import SeedVendorScreen from '../screens/SeedVendorScreen';
import GroupsScreen from '../screens/GroupsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreditScreen from '../screens/CreditScreen';

const Stack = createStackNavigator();

export default function AppNavigator({ session }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outline,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      {!session ? (
        // Auth Stack
        <>
          <Stack.Screen
            name="AgeVerification"
            component={AgeVerificationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Garden"
            component={GardenScreen}
            options={{ title: 'The Garden' }}
          />
          <Stack.Screen
            name="Scan"
            component={ScanScreen}
            options={{ title: 'AI Scan' }}
          />
          <Stack.Screen
            name="StrainBrowser"
            component={StrainBrowserScreen}
            options={{ title: 'Strain Browser' }}
          />
          <Stack.Screen
            name="StrainDetail"
            component={StrainDetailScreen}
            options={{ title: 'Strain Details' }}
          />
          <Stack.Screen
            name="Reviews"
            component={ReviewsScreen}
            options={{ title: 'Reviews Hub' }}
          />
          <Stack.Screen
            name="Dispensaries"
            component={DispensaryFinderScreen}
            options={{ title: 'Find Dispensaries' }}
          />
          <Stack.Screen
            name="SeedVendors"
            component={SeedVendorScreen}
            options={{ title: 'Seed Vendors' }}
          />
          <Stack.Screen
            name="Groups"
            component={GroupsScreen}
            options={{ title: 'Community Groups' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
          <Stack.Screen
            name="Credits"
            component={CreditScreen}
            options={{ title: 'Scan Credits' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

