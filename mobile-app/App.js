import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import { registerForPushNotifications, scheduleCheckInReminder } from './src/services/notifications';
import { ThemeProvider } from './src/services/theme';
import { I18nProvider } from './src/services/i18n';
import { isBiometricAvailable, authenticateWithBiometric, isBiometricEnabled } from './src/services/biometric';
import HomeScreen from './src/screens/HomeScreen';
import QRScanScreen from './src/screens/QRScanScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ onLogout }) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1a5276',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: {
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 60 + bottomPadding,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          backgroundColor: '#fff',
          elevation: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{
        tabBarLabel: 'Check In',
        tabBarIcon: ({ color, size }) => <Ionicons name="location" size={size} color={color} />,
      }} />
      <Tab.Screen name="QRScan" component={QRScanScreen} options={{
        tabBarLabel: 'QR Scan',
        tabBarIcon: ({ color, size }) => <Ionicons name="qr-code" size={size} color={color} />,
      }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{
        tabBarLabel: 'History',
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
      }} />
      <Tab.Screen name="Profile" options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
      }}>
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('token').then(async (token) => {
      if (token) {
        // Check if biometric is enabled
        const bioEnabled = await isBiometricEnabled();
        const bioAvailable = await isBiometricAvailable();

        if (bioEnabled && bioAvailable) {
          const success = await authenticateWithBiometric();
          if (!success) {
            setLoading(false);
            return; // Stay on login screen
          }
        }

        setIsLoggedIn(true);
        registerForPushNotifications();
        scheduleCheckInReminder();
      }
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return (
    <I18nProvider>
    <ThemeProvider>
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <Stack.Screen name="Main">
              {() => <MainTabs onLogout={() => setIsLoggedIn(false)} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen
                    {...props}
                    onLogin={() => setIsLoggedIn(true)}
                    onForgotPassword={() => props.navigation.navigate('ForgotPassword')}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </ThemeProvider>
    </I18nProvider>
  );
}
