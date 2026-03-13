import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert, TouchableOpacity, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { checkIn } from '../services/api';
import { getCurrentLocation } from '../services/location';

export default function QRScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#1a5276" /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan QR codes from staff ID cards.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const qrData = JSON.parse(data);
      const user = JSON.parse(await AsyncStorage.getItem('user'));

      if (qrData.staffId !== user?.staffId) {
        Alert.alert('Invalid QR Code', 'This QR code does not match your staff ID.');
        setScanned(false);
        setLoading(false);
        return;
      }

      let location = null;
      try { location = await getCurrentLocation(); } catch {}

      const { data: result } = await checkIn({
        latitude: location?.latitude,
        longitude: location?.longitude,
        method: 'qr_code',
        qrCode: qrData.code,
        deviceId: Device.osBuildId || 'unknown',
      });

      Alert.alert(
        'Check-In Successful',
        result.isLate ? 'Checked in via QR code. You are marked as LATE.' : 'Checked in via QR code successfully!'
      );
    } catch (err) {
      const message = err.response?.data?.error || 'Invalid QR code or check-in failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
      setTimeout(() => setScanned(false), 3000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>QR Code Check-In</Text>
        <Text style={styles.subtitle}>Scan your staff ID card QR code</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
        </View>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Position the QR code from your staff ID card within the frame above
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { padding: 20, paddingTop: 30 },
  title: { fontSize: 24, fontWeight: '700', color: '#2c3e50' },
  subtitle: { fontSize: 14, color: '#7f8c8d', marginTop: 4 },
  cameraContainer: { flex: 1, margin: 20, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: 250, height: 250, borderWidth: 3, borderColor: '#fff',
    borderRadius: 16, backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 16, fontWeight: '500' },
  instructions: { padding: 20, alignItems: 'center' },
  instructionText: { fontSize: 14, color: '#7f8c8d', textAlign: 'center' },
  permissionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  permissionText: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginBottom: 24 },
  permissionBtn: { backgroundColor: '#1a5276', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10 },
  permissionBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
