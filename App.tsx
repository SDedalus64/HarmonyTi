import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/navigation/contexts/AuthContext';
import { View, ActivityIndicator, AppState } from 'react-native';
import { TariffService } from './src/services/tariffService';
import { tariffSearchService } from './src/services/tariffSearchService';
import { SettingsProvider } from './src/hooks/useSettings';

// First launch key for AsyncStorage
const FIRST_LAUNCH_KEY = '@HarmonyTi:firstLaunch';

// Start preloading tariff data immediately when the app module loads
// This happens before any React components are rendered
console.log('🚀 App module loaded - starting tariff data preload...');

// Initialize search service (for autocomplete)
if (!tariffSearchService.isInitialized()) {
  tariffSearchService.initialize()
    .then(() => console.log('✅ Search service initialized'))
    .catch((error) => console.warn('⚠️ Search service initialization failed:', error));
}

// Initialize main tariff service
const tariffService = TariffService.getInstance();
if (!tariffService.isInitialized()) {
  tariffService.initialize()
    .then(() => console.log('✅ Main tariff data preloaded'))
    .catch((error) => console.warn('⚠️ Main tariff data preload failed:', error));
}

function AppContent() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('App component initializing...');

        // Check first launch
        const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        if (hasLaunched === null) {
          await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }

        console.log('App initialization complete');
      } catch (error) {
        console.error('Error during app initialization:', error);
        setIsFirstLaunch(false);
      } finally {
        setIsInitializing(false);
      }
    }

    initializeApp();
  }, []);

  // Show loading state while auth is being initialized
  if (isInitializing || isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0A99F2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AppNavigator
        isAuthenticated={isLoggedIn}
        isFirstLaunch={isFirstLaunch}
      />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <AuthProvider>
        <SettingsProvider>
        <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
