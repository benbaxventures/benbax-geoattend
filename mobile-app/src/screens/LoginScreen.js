import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { login, googleLogin } from '../services/api';

const GOOGLE_WEB_CLIENT_ID = '725872424154-gv0c4blr061adus9iuaf8htc09pjk5l8.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '725872424154-kqvhr7s8r4aqnjhkdid8gf4euscd1c6i.apps.googleusercontent.com';

export default function LoginScreen({ onLogin, onForgotPassword, onRegister }) {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // Use Expo auth proxy to avoid custom scheme issues
      const redirectUri = 'https://auth.expo.io/@A16-0/geoattend';
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_WEB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent('profile email')}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        const params = new URLSearchParams(result.url.split('#')[1]);
        const accessToken = params.get('access_token');

        if (accessToken) {
          const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const userInfo = await res.json();

          let deviceInfo = {};
          try {
            deviceInfo = {
              deviceId: Device.osBuildId || Device.modelId || 'unknown',
              deviceModel: Device.modelName || 'unknown',
              osVersion: `${Device.osName || 'Android'} ${Device.osVersion || ''}`.trim(),
            };
          } catch (e) {
            deviceInfo = { deviceId: 'unknown', deviceModel: 'unknown', osVersion: 'unknown' };
          }

          const { data } = await googleLogin({
            googleId: userInfo.id,
            email: userInfo.email,
            firstName: userInfo.given_name,
            lastName: userInfo.family_name,
            profilePhoto: userInfo.picture,
            ...deviceInfo,
          });

          await AsyncStorage.setItem('token', data.token);
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
          await AsyncStorage.setItem('institution', JSON.stringify(data.institution));
          onLogin();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Google login failed';
      Alert.alert('Login Failed', msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!staffId.trim() || !password) {
      Alert.alert('Error', 'Please enter your Staff ID and password');
      return;
    }

    setLoading(true);
    try {
      let deviceInfo = {};
      try {
        deviceInfo = {
          deviceId: Device.osBuildId || Device.modelId || 'unknown',
          deviceModel: Device.modelName || 'unknown',
          osVersion: `${Device.osName || 'Android'} ${Device.osVersion || ''}`.trim(),
        };
      } catch (e) {
        deviceInfo = { deviceId: 'unknown', deviceModel: 'unknown', osVersion: 'unknown' };
      }

      const { data } = await login(staffId.trim().toUpperCase(), password, deviceInfo);

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      await AsyncStorage.setItem('institution', JSON.stringify(data.institution));

      onLogin();
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      const debug = err.response?.data?.debug;
      const msg = serverMsg || err.message || 'Unable to connect to server';
      Alert.alert('Login Failed', debug ? `${msg} (${debug})` : msg);
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
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#bdc3c7"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onForgotPassword && onForgotPassword()}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#333" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => onRegister && onRegister()}>
          <Text style={styles.registerLink}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Geofenced Attendance System</Text>
        <Text style={styles.powered}>Powered by Benbax software developers</Text>
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
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10,
  },
  passwordInput: {
    flex: 1, padding: 14, fontSize: 15, color: '#2c3e50',
  },
  eyeButton: { padding: 14 },
  eyeIcon: { fontSize: 20 },
  button: {
    backgroundColor: '#1a5276', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerText: { marginHorizontal: 12, color: '#bdc3c7', fontSize: 13, fontWeight: '600' },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    borderWidth: 1.5, borderColor: '#e0e0e0',
  },
  googleIcon: {
    fontSize: 20, fontWeight: '700', color: '#4285F4', marginRight: 10,
  },
  googleButtonText: { fontSize: 15, fontWeight: '600', color: '#333' },
  forgotText: { textAlign: 'right', color: '#1a5276', fontSize: 13, fontWeight: '500', marginTop: 8 },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 32 },
  registerLink: { textAlign: 'center', color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 20 },
  powered: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 },
});
