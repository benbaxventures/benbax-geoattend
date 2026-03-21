import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  SafeAreaView, RefreshControl, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLocation, calculateDistance } from '../services/location';
import { checkIn, checkOut, getTodayStatus, getWeeklyStats } from '../services/api';
import * as Device from 'expo-device';

export default function HomeScreen() {
  const [user, setUser] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [todayStatus, setTodayStatus] = useState('not_checked_in');
  const [record, setRecord] = useState(null);
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  const loadData = useCallback(async () => {
    const userData = JSON.parse(await AsyncStorage.getItem('user'));
    const instData = JSON.parse(await AsyncStorage.getItem('institution'));
    setUser(userData);
    setInstitution(instData);

    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      if (instData) {
        const dist = calculateDistance(loc.latitude, loc.longitude, instData.latitude, instData.longitude);
        setDistance(dist);
      }
    } catch {
      // Location might not be available
    }

    try {
      const { data } = await getTodayStatus();
      setTodayStatus(data.status);
      setRecord(data.record);
    } catch {}

    try {
      const { data } = await getWeeklyStats();
      setStats(data.month);
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCheckIn = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Unable to get your location. Please enable GPS.');
      return;
    }

    if (institution && distance > institution.geofenceRadius) {
      Alert.alert(
        'Outside Geofence',
        `You are ${distance}m from the institution. You must be within ${institution.geofenceRadius}m to check in.`
      );
      return;
    }

    setLoading(true);
    try {
      const { data } = await checkIn({
        latitude: location.latitude,
        longitude: location.longitude,
        method: 'gps',
        deviceId: Device.osBuildId || 'unknown',
      });

      setTodayStatus('checked_in');
      setRecord(data.record);

      Alert.alert(
        'Check-In Successful',
        data.isLate ? 'You have been marked as LATE.' : 'You have been checked in on time.'
      );
    } catch (err) {
      Alert.alert('Check-In Failed', err.response?.data?.error || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      let loc = location;
      try { loc = await getCurrentLocation(); } catch {}

      await checkOut({
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        method: 'gps',
        deviceId: Device.osBuildId || 'unknown',
      });

      setTodayStatus('checked_out');
      Alert.alert('Check-Out Successful', 'You have been checked out. See you tomorrow!');
    } catch (err) {
      Alert.alert('Check-Out Failed', err.response?.data?.error || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const isWithin = institution && distance !== null && distance <= institution.geofenceRadius;
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a5276" />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{user?.firstName || 'Staff'}</Text>
          <Text style={styles.date}>
            {now.toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Geofence Status */}
        <View style={[styles.card, { borderLeftColor: isWithin ? '#27ae60' : '#e74c3c' }]}>
          <Text style={styles.cardLabel}>LOCATION STATUS</Text>
          {distance !== null ? (
            <>
              <Text style={[styles.cardValue, { color: isWithin ? '#27ae60' : '#e74c3c' }]}>
                {isWithin ? 'Within Geofence' : 'Outside Geofence'}
              </Text>
              <Text style={styles.cardDetail}>
                {distance}m from institution ({institution?.geofenceRadius}m radius)
              </Text>
            </>
          ) : (
            <Text style={styles.cardDetail}>Getting location...</Text>
          )}
        </View>

        {/* Today's Status */}
        <View style={[styles.card, { borderLeftColor: '#3498db' }]}>
          <Text style={styles.cardLabel}>TODAY'S STATUS</Text>
          <Text style={styles.cardValue}>
            {todayStatus === 'checked_in' ? 'Checked In' :
             todayStatus === 'checked_out' ? 'Checked Out' : 'Not Checked In'}
          </Text>
          {record?.check_in_time && (
            <Text style={styles.cardDetail}>
              In: {new Date(record.check_in_time).toLocaleTimeString()}
              {record.check_out_time && ` | Out: ${new Date(record.check_out_time).toLocaleTimeString()}`}
              {record.is_late && ' | LATE'}
            </Text>
          )}
        </View>

        {/* Monthly Summary */}
        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>THIS MONTH</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: '#eafaf1' }]}>
                <Text style={[styles.statNumber, { color: '#27ae60' }]}>{stats.present}</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#fef9e7' }]}>
                <Text style={[styles.statNumber, { color: '#f39c12' }]}>{stats.late}</Text>
                <Text style={styles.statLabel}>Late</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#fdedec' }]}>
                <Text style={[styles.statNumber, { color: '#e74c3c' }]}>{stats.absent}</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#ebf5fb' }]}>
                <Text style={[styles.statNumber, { color: '#3498db' }]}>{stats.avgHours || '0'}h</Text>
                <Text style={styles.statLabel}>Avg Hours</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionSection}>
          {todayStatus === 'not_checked_in' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.checkInBtn, (!isWithin || loading) && styles.disabledBtn]}
              onPress={handleCheckIn}
              disabled={!isWithin || loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.actionBtnText}>Check In</Text>
                  <Text style={styles.actionBtnSub}>GPS Verification</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {todayStatus === 'checked_in' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.checkOutBtn, loading && styles.disabledBtn]}
              onPress={handleCheckOut}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.actionBtnText}>Check Out</Text>
                  <Text style={styles.actionBtnSub}>End your shift</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {todayStatus === 'checked_out' && (
            <View style={[styles.actionBtn, styles.doneBtn]}>
              <Text style={styles.actionBtnText}>All Done!</Text>
              <Text style={styles.actionBtnSub}>See you tomorrow</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  scroll: { padding: 20 },
  header: { marginBottom: 24, paddingTop: 20 },
  greeting: { fontSize: 16, color: '#7f8c8d' },
  name: { fontSize: 28, fontWeight: '700', color: '#2c3e50', marginTop: 2 },
  date: { fontSize: 13, color: '#95a5a6', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 18, marginBottom: 12,
    borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardLabel: { fontSize: 11, fontWeight: '700', color: '#95a5a6', letterSpacing: 0.5, marginBottom: 6 },
  cardValue: { fontSize: 18, fontWeight: '700', color: '#2c3e50' },
  cardDetail: { fontSize: 13, color: '#7f8c8d', marginTop: 4 },
  statsContainer: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  statsTitle: { fontSize: 11, fontWeight: '700', color: '#95a5a6', letterSpacing: 0.5, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statBox: {
    flex: 1, borderRadius: 10, padding: 12, alignItems: 'center',
  },
  statNumber: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#7f8c8d', marginTop: 2 },
  actionSection: { marginTop: 20, alignItems: 'center' },
  actionBtn: {
    width: '100%', paddingVertical: 20, borderRadius: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  checkInBtn: { backgroundColor: '#27ae60' },
  checkOutBtn: { backgroundColor: '#e74c3c' },
  doneBtn: { backgroundColor: '#95a5a6' },
  disabledBtn: { opacity: 0.5 },
  actionBtnText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  actionBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});
