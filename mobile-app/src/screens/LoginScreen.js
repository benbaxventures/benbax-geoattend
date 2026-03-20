import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { login } from '../services/api';

export default function LoginScreen({ onLogin }) {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!staffId.trim() || !password) {
      Alert.alert('Error', 'Please enter your Staff ID and password');
      return;
    }

    setLoading(true);
    try {
      const deviceInfo = {
        deviceId: Device.osBuildId || Device.modelId || 'unknown',
        deviceModel: Device.modelName || 'unknown',
        osVersion: `${Device.osName} ${Device.osVersion}`,
      };

      const { data } = await login(staffId.trim().toUpperCase(), password, deviceInfo);

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      await AsyncStorage.setItem('institution', JSON.stringify(data.institution));

      onLogin();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error || err.message || 'Unable to connect to server';
      const debug = data?.debug || 'no debug info';
      Alert.alert('Login Failed', `${msg}\n\nDebug: ${debug}\n\nStatus: ${err.response?.status}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.logoSection}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>G</Text>
          </View>
          <Text style={styles.appName}>GeoAttend</Text>
          <Text style={styles.subtitle}>Staff Attendance System</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Staff ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your Staff ID"
              value={staffId}
              onChangeText={setStaffId}
              autoCapitalize="characters"
              placeholderTextColor="#bdc3c7"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#bdc3c7"
            />
          </View>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Geofenced Attendance System</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a5276' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  iconText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  appName: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  form: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#7f8c8d', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10,
    padding: 14, fontSize: 15, color: '#2c3e50',
  },
  button: {
    backgroundColor: '#1a5276', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 32 },
});
