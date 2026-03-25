import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { login, googleLogin } from '../services/api';
import { useToast } from '../services/Toast';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '725872424154-gv0c4blr061adus9iuaf8htc09pjk5l8.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function LoginScreen({ onLogin, onForgotPassword, onRegister }) {
  const toast = useToast();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [recentAccounts, setRecentAccounts] = useState([]);

  const redirectUri = AuthSession.makeRedirectUri({ preferLocalhost: false });

  useEffect(() => {
    AsyncStorage.getItem('recentAccounts').then(stored => {
      if (stored) setRecentAccounts(JSON.parse(stored));
    }).catch(() => {});
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Token,
        usePKCE: false,
      });

      const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        const { access_token } = result.params;

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const userInfo = await userInfoResponse.json();

        let deviceInfo = {};
        try {
          deviceInfo = {
            deviceId: (Device.osBuildId || Device.modelId || Device.modelName || 'unknown').substring(0, 100),
            deviceModel: (Device.modelName || 'unknown').substring(0, 100),
            osVersion: `${Device.osName || Platform.OS} ${Device.osVersion || ''}`.trim().substring(0, 100),
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
      } else if (result.type === 'cancel') {
        // User cancelled
      } else {
        toast.error('Google login failed. Please try again.', 'Login Failed');
      }
    } catch (err) {
      const serverError = err.response?.data?.error || err.message || 'Google login failed';
      toast.error(serverError, 'Login Failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!staffId.trim() || !password) {
      toast.error('Please enter your Student ID and password');
      return;
    }

    setLoading(true);
    try {
      let deviceInfo = {};
      try {
        deviceInfo = {
          deviceId: (Device.osBuildId || Device.modelId || Device.modelName || 'unknown').substring(0, 100),
          deviceModel: (Device.modelName || 'unknown').substring(0, 100),
          osVersion: `${Device.osName || Platform.OS} ${Device.osVersion || ''}`.trim().substring(0, 100),
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
      toast.error(debug ? `${msg} (${debug})` : msg, 'Login Failed');
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
          <Text style={styles.subtitle}>Student Attendance System</Text>
        </View>

        {recentAccounts.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Accounts</Text>
            <View style={styles.recentList}>
              {recentAccounts.map((acc) => (
                <TouchableOpacity
                  key={acc.staffId}
                  style={[styles.recentItem, staffId === acc.staffId && styles.recentItemActive]}
                  onPress={() => setStaffId(acc.staffId)}
                >
                  <View style={styles.recentAvatar}>
                    <Text style={styles.recentAvatarText}>
                      {(acc.firstName?.[0] || '') + (acc.lastName?.[0] || '')}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentName} numberOfLines={1}>{acc.firstName} {acc.lastName}</Text>
                    <Text style={styles.recentId}>{acc.staffId}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Student ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your Student ID"
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

        <Text style={styles.footer}>Geofenced Student Attendance System</Text>
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
  recentSection: { marginBottom: 16 },
  recentTitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  recentList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 10,
    minWidth: '45%', flex: 1,
  },
  recentItemActive: { backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  recentAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  recentAvatarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  recentName: { fontSize: 12, fontWeight: '600', color: '#fff' },
  recentId: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  forgotText: { textAlign: 'right', color: '#1a5276', fontSize: 13, fontWeight: '500', marginTop: 8 },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 32 },
  registerLink: { textAlign: 'center', color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 20 },
  powered: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 },
});
