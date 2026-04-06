/**
 * BillingNative.js
 * ----------------
 * Native Paystack integration stubs and usage notes for the mobile app.
 *
 * Purpose:
 * - Provide a React Native screen stub that demonstrates how to call a native
 *   Paystack SDK to charge a card and then send the returned `reference` to
 *   the backend for server-side verification and subscription activation.
 *
 * Notes:
 * - This file contains instructional comments and placeholder code. Replace
 *   the placeholder `Paystack` calls with the API of the native wrapper you
 *   choose (e.g. `react-native-paystack` or another actively maintained SDK).
 * - If you're using Expo managed workflow you must build a custom dev client
 *   or an EAS build because native modules require a native binary.
 *
 * Quick steps (high level):
 * 1. Choose a native wrapper (search npm for current recommended package).
 * 2. Install and configure the native module (follow package README).
 * 3. Add your Paystack public key to build-time config (EAS secrets or app.json extras).
 * 4. Build with EAS (dev client or production build) so native code is included.
 * 5. Use the SDK to charge and on success POST the `reference` to
 *    `/institutions/subscription/activate` on the backend. Backend verifies
 *    the reference with Paystack secret key (`PAYSTACK_SECRET_KEY`).
 *
 * Example EAS (Expo Application Services) steps:
 * - Install EAS CLI: `npm install -g eas-cli`
 * - Login: `eas login`
 * - (Optionally) create secrets:
 *     `eas secret:create --name PAYSTACK_PUBLIC_KEY --value <pk_test_xxx>`
 *     `eas secret:create --name PAYSTACK_SECRET_KEY --value <sk_test_xxx>` (server only)
 * - Build an Android dev client: `eas build --platform android --profile development`
 * - Install dev client on device and test native SDK.
 *
 * Security:
 * - Never store `PAYSTACK_SECRET_KEY` in the client. Only the server should hold
 *   secret keys and verify transactions.
 */

import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateSubscription } from '../services/api';

// Placeholder import: replace with the real native SDK you choose
// e.g. import Paystack from 'react-native-paystack';
const Paystack = null;

const PAYSTACK_PUBLIC_KEY = Constants.expoConfig?.extra?.PAYSTACK_PUBLIC_KEY || '<REPLACE_WITH_PUBLIC_KEY_AT_BUILD_TIME>';

export default function BillingNative({ navigation }) {
  const [loading, setLoading] = useState(false);

  const handleNativePayment = async (plan) => {
    setLoading(true);
    try {
      if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY.includes('REPLACE_WITH')) {
        Alert.alert('Configuration', 'Paystack public key is not configured. Add PAYSTACK_PUBLIC_KEY to extras or EAS secrets.');
        setLoading(false);
        return;
      }

      // Get admin email from local storage (or use logged-in user)
      const storedUser = await AsyncStorage.getItem('user');
      const email = storedUser ? JSON.parse(storedUser).email : 'billing@institution.local';

      // TODO: Replace the following block with the actual SDK usage.
      // EXAMPLE (pseudocode):
      // Paystack.init({ publicKey: PAYSTACK_PUBLIC_KEY });
      // const response = await Paystack.chargeCard({ email, amount: plan.priceNGN * 100 });
      // const reference = response.reference;

      // For now we simulate success to show the flow.
      const fakeReference = `FAKE-REF-${Date.now()}`;

      // After getting `reference` from native SDK, send it to backend for verification.
      const payload = {
        planName: plan.name,
        durationDays: plan.days,
        paymentReference: fakeReference,
      };

      // send to backend to verify and activate
      await activateSubscription(payload);

      Alert.alert('Success', 'Subscription activated (simulated).');
    } catch (err) {
      console.error('Native payment error:', err?.response?.data || err.message || err);
      Alert.alert('Payment failed', err?.response?.data?.error || err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const demoPlan = { name: 'Monthly', days: 30, priceNGN: 5000 };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Native Billing (Paystack)</Text>
      <Text style={styles.hint}>
        This screen demonstrates where native Paystack integration will be wired.
        Replace the stubbed SDK calls with the real SDK methods from your chosen library.
      </Text>

      <View style={styles.card}>
        <Text style={styles.planTitle}>{demoPlan.name} — ₦{demoPlan.priceNGN.toLocaleString()}</Text>
        <Text style={styles.planSubtitle}>{demoPlan.days} days</Text>
        <Button title={loading ? 'Processing...' : 'Pay with Paystack (Native)'} onPress={() => handleNativePayment(demoPlan)} disabled={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  hint: { color: '#666', marginBottom: 16 },
  card: { padding: 16, borderRadius: 10, backgroundColor: '#f7f9fa', marginBottom: 12 },
  planTitle: { fontSize: 16, fontWeight: '700' },
  planSubtitle: { color: '#777', marginBottom: 12 },
});
