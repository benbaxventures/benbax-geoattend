import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountTypeScreen({ navigation, onSelected }) {
  const [saving, setSaving] = useState(null); // 'student' | 'staff' | null

  const choose = async (memberType) => {
    setSaving(memberType);
    try {
      await AsyncStorage.setItem('memberType', memberType);
      if (onSelected) onSelected(memberType);
      const routeNames = navigation?.getState?.()?.routeNames || [];
      if (routeNames.includes('Login')) {
        navigation.replace('Login');
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Choose Account Type</Text>
        <Text style={styles.subtitle}>
          Select how you want to use Benbax GeoAttend on this device.
        </Text>

        <TouchableOpacity
          style={[styles.option, styles.student]}
          onPress={() => choose('student')}
          disabled={!!saving}
        >
          {saving === 'student' ? (
            <ActivityIndicator color="#1a5276" />
          ) : (
            <>
              <Text style={styles.optionTitle}>Student</Text>
              <Text style={styles.optionText}>Check in using your phone (GPS/QR).</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, styles.staff]}
          onPress={() => choose('staff')}
          disabled={!!saving}
        >
          {saving === 'staff' ? (
            <ActivityIndicator color="#1a5276" />
          ) : (
            <>
              <Text style={styles.optionTitle}>Staff</Text>
              <Text style={styles.optionText}>Work attendance for institutions and offices.</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>You can change this later in Profile.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a5276', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#2c3e50', textAlign: 'center' },
  subtitle: { marginTop: 8, fontSize: 13, color: '#7f8c8d', textAlign: 'center' },
  option: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e6e6e6',
    padding: 16,
  },
  student: { backgroundColor: '#f3f8ff' },
  staff: { backgroundColor: '#f7f3ff' },
  optionTitle: { fontSize: 16, fontWeight: '800', color: '#1a5276' },
  optionText: { marginTop: 4, fontSize: 12, color: '#566573' },
  footer: { marginTop: 18, fontSize: 11, color: '#95a5a6', textAlign: 'center' },
});

