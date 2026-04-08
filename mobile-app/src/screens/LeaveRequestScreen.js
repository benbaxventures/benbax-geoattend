import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { requestLeave, getMyLeaves, cancelLeave } from '../services/api';

export default function LeaveRequestScreen({ navigation }) {
  const [leaveType, setLeaveType] = useState('personal');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reason, setReason] = useState('');
  const [myLeaves, setMyLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = () => {
    getMyLeaves().then(r => setMyLeaves(r.data)).catch(() => {});
  };

  const onSubmit = async () => {
    if (!startDate || !endDate) return Alert.alert('Validation', 'Please pick start and end date');
    setLoading(true);
    try {
      await requestLeave({ leaveType, startDate: startDate.toISOString(), endDate: endDate.toISOString(), reason });
      Alert.alert('Success', 'Leave request submitted');
      setLeaveType('personal'); setStartDate(null); setEndDate(null); setReason('');
      fetchLeaves();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to submit');
    } finally { setLoading(false); }
  };

  const onCancel = (id) => {
    Alert.alert('Cancel Leave', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: async () => { try { await cancelLeave(id); fetchLeaves(); Alert.alert('Cancelled'); } catch { Alert.alert('Failed to cancel'); } } }
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Request Leave</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Type</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.typeBtn, leaveType === 'personal' && styles.typeBtnActive]} onPress={() => setLeaveType('personal')}>
            <Text style={leaveType === 'personal' ? styles.typeTxtActive : styles.typeTxt}>Personal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, leaveType === 'sick' && styles.typeBtnActive]} onPress={() => setLeaveType('sick')}>
            <Text style={leaveType === 'sick' ? styles.typeTxtActive : styles.typeTxt}>Sick</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, leaveType === 'vacation' && styles.typeBtnActive]} onPress={() => setLeaveType('vacation')}>
            <Text style={leaveType === 'vacation' ? styles.typeTxtActive : styles.typeTxt}>Vacation</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => {
          navigation.navigate('DatePicker', { onPick: (d) => setStartDate(new Date(d)) });
        }}>
          <Text>{startDate ? startDate.toDateString() : 'Pick start date'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => {
          navigation.navigate('DatePicker', { onPick: (d) => setEndDate(new Date(d)) });
        }}>
          <Text>{endDate ? endDate.toDateString() : 'Pick end date'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Reason (optional)</Text>
        <TextInput style={styles.textarea} multiline value={reason} onChangeText={setReason} />

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
          <TouchableOpacity style={styles.btn} onPress={onSubmit} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.title, { marginTop: 18 }]}>My Requests</Text>
      <View style={styles.card}>
        {myLeaves.map(l => (
          <View key={l.id} style={styles.leaveRow}>
            <View>
              <Text style={{ fontWeight: '700' }}>{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</Text>
              <Text style={{ color: '#666' }}>{l.leave_type} • {l.status}</Text>
            </View>
            {l.status === 'pending' && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel(l.id)}>
                <Text style={{ color: '#fff' }}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {myLeaves.length === 0 && <Text style={{ color: '#666' }}>No leave requests</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 },
  label: { fontSize: 13, color: '#666', marginTop: 8, marginBottom: 6 },
  typeBtn: { padding: 8, borderRadius: 8, backgroundColor: '#f0f2f5' },
  typeBtnActive: { backgroundColor: '#1a5276' },
  typeTxt: { color: '#333' },
  typeTxtActive: { color: '#fff' },
  dateBtn: { padding: 12, borderRadius: 8, backgroundColor: '#f5f7fa' },
  textarea: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 8, minHeight: 80 },
  btn: { backgroundColor: '#1a5276', padding: 10, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  leaveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cancelBtn: { backgroundColor: '#e74c3c', padding: 8, borderRadius: 8 }
});
