import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView,
  ScrollView, TextInput, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import * as ImagePicker from 'expo-image-picker';
import { getProfile, changePassword } from '../services/api';
import { useTheme } from '../services/theme';
import { useToast } from '../services/Toast';
import { isBiometricAvailable, isBiometricEnabled, setBiometricEnabled } from '../services/biometric';
import { useI18n } from '../services/i18n';

export default function ProfileScreen({ navigation, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const { isDark, toggleTheme, theme } = useTheme();
  const { t, lang, switchLanguage } = useI18n();
  const toast = useToast();
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBioAvailable);
    isBiometricEnabled().then(setBioEnabled);
  }, []);

  useEffect(() => {
    getProfile().then(r => {
      setProfile(r.data);
      if (r.data.profile_photo_url) setProfilePhoto(r.data.profile_photo_url);
    }).catch(async () => {
      // Fallback: load from local storage
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setProfile({
            first_name: user.firstName,
            last_name: user.lastName,
            staff_id: user.staffId,
            email: user.email,
            role: user.role,
            department: user.department || '-',
            position: user.position || '-',
            institution_name: user.institutionName || '-',
          });
        }
      } catch {}
    });
  }, []);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickPhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in both fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const saveToRecentAccounts = async () => {
    try {
      if (!profile) return;
      const stored = await AsyncStorage.getItem('recentAccounts');
      let accounts = stored ? JSON.parse(stored) : [];
      // Remove if already exists, then add to front
      accounts = accounts.filter(a => a.staffId !== profile.staff_id);
      accounts.unshift({
        staffId: profile.staff_id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        department: profile.department,
      });
      // Keep max 5 recent accounts
      accounts = accounts.slice(0, 5);
      await AsyncStorage.setItem('recentAccounts', JSON.stringify(accounts));
    } catch {}
  };

  const handleSwitchAccount = () => {
    Alert.alert('Switch Account', 'Sign out and switch to a different staff account on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Switch',
        onPress: async () => {
          await saveToRecentAccounts();
          await AsyncStorage.multiRemove(['token', 'user', 'institution']);
          if (onLogout) onLogout();
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await saveToRecentAccounts();
          await AsyncStorage.multiRemove(['token', 'user', 'institution']);
          if (onLogout) {
            onLogout();
          } else {
            try { await Updates.reloadAsync(); } catch { }
          }
        },
      },
    ]);
  };

  const truncateValue = (val, maxLen = 24) => {
    if (!val || val.length <= maxLen) return val || '-';
    // For emails: show first 4 chars + ... + domain
    if (val.includes('@')) {
      const [local, domain] = val.split('@');
      if (local.length > 6) {
        return `${local.slice(0, 4)}...@${domain}`;
      }
    }
    return val.slice(0, maxLen - 3) + '...';
  };

  const InfoRow = ({ label, value, truncate = false }) => (
    <View style={[styles.infoRow, { borderBottomColor: theme.dark ? '#333' : '#f5f5f5' }]}>
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
        {truncate ? truncateValue(value) : (value || '-')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>{t('profile')}</Text>

        {profile && (
          <>
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={handlePhotoOptions}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(profile.first_name?.[0] || '') + (profile.last_name?.[0] || '')}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Text style={styles.cameraBadgeText}>📷</Text>
                </View>
              </TouchableOpacity>
              <Text style={[styles.fullName, { color: theme.text }]}>{profile.first_name} {profile.last_name}</Text>
              <Text style={[styles.staffIdText, { color: theme.textSecondary }]}>{profile.staff_id}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <InfoRow label="Email" value={profile.email} truncate />
              <InfoRow label="Phone" value={profile.phone} />
              <InfoRow label="Department" value={profile.department} />
              <InfoRow label="Position" value={profile.position} />
              <InfoRow label="Institution" value={profile.institution_name} />
              <InfoRow label="Role" value={profile.role} />
            </View>

            <TouchableOpacity style={[styles.passwordBtn, { backgroundColor: theme.card }]} onPress={() => setShowPasswordForm(!showPasswordForm)}>
              <Text style={[styles.passwordBtnText, { color: theme.primary }]}>{t('changePassword')}</Text>
            </TouchableOpacity>

            {showPasswordForm && (
              <View style={styles.card}>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Current Password</Text>
                  <TextInput
                    style={styles.formInput}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>New Password</Text>
                  <TextInput
                    style={styles.formInput}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  <Text style={styles.submitBtnText}>{loading ? 'Saving...' : 'Update Password'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {bioAvailable && (
              <TouchableOpacity style={styles.passwordBtn} onPress={async () => {
                const newVal = !bioEnabled;
                await setBiometricEnabled(newVal);
                setBioEnabled(newVal);
                toast.success(`Fingerprint login ${newVal ? 'enabled' : 'disabled'}`);
              }}>
                <Text style={styles.passwordBtnText}>{bioEnabled ? '🔓 Disable Fingerprint Login' : '🔐 Enable Fingerprint Login'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.passwordBtn} onPress={() => switchLanguage(lang === 'en' ? 'tw' : 'en')}>
              <Text style={styles.passwordBtnText}>{lang === 'en' ? '🇬🇭 Switch to Twi' : '🇬🇧 Switch to English'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.passwordBtn} onPress={toggleTheme}>
              <Text style={styles.passwordBtnText}>{isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.passwordBtn, { borderWidth: 1, borderColor: '#3498db', backgroundColor: theme.card }]} onPress={handleSwitchAccount}>
              <Text style={[styles.passwordBtnText, { color: '#3498db' }]}>Switch Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.passwordBtn, { borderWidth: 1, borderColor: '#27ae60', backgroundColor: theme.card }]} onPress={() => navigation.navigate('LeaveRequest')}>
              <Text style={[styles.passwordBtnText, { color: '#27ae60' }]}>Request Leave</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  scroll: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#2c3e50', paddingTop: 10, marginBottom: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a5276',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  cameraBadge: {
    position: 'absolute', bottom: 8, right: -4,
    backgroundColor: '#1a5276', width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
  },
  cameraBadgeText: { fontSize: 14 },
  fullName: { fontSize: 20, fontWeight: '700', color: '#2c3e50' },
  staffIdText: { fontSize: 14, color: '#7f8c8d', marginTop: 2 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  infoLabel: { fontSize: 14, color: '#7f8c8d', width: 100 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#2c3e50', flex: 1, textAlign: 'right' },
  passwordBtn: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  passwordBtnText: { fontSize: 15, fontWeight: '600', color: '#1a5276' },
  formField: { marginBottom: 14 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#7f8c8d', marginBottom: 6 },
  formInput: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 8,
    padding: 12, fontSize: 15, color: '#2c3e50',
  },
  submitBtn: { backgroundColor: '#1a5276', borderRadius: 8, padding: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  logoutBtn: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#e74c3c',
  },
  logoutBtnText: { fontSize: 15, fontWeight: '600', color: '#e74c3c' },
});
