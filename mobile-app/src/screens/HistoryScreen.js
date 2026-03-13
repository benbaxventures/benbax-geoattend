import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native';
import { getMyAttendance } from '../services/api';

export default function HistoryScreen() {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async (pageNum = 1, append = false) => {
    try {
      const { data } = await getMyAttendance({ page: pageNum, limit: 20 });
      setRecords(prev => append ? [...prev, ...data.records] : data.records);
      setTotal(data.total);
      setPage(pageNum);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords(1, false);
  };

  const onEndReached = () => {
    if (records.length < total) {
      fetchRecords(page + 1, true);
    }
  };

  const renderItem = ({ item }) => {
    const date = new Date(item.date);
    const checkIn = new Date(item.check_in_time);
    const checkOut = item.check_out_time ? new Date(item.check_out_time) : null;

    return (
      <View style={styles.card}>
        <View style={styles.dateSection}>
          <Text style={styles.dayName}>{date.toLocaleDateString('en-GH', { weekday: 'short' })}</Text>
          <Text style={styles.dayNum}>{date.getDate()}</Text>
          <Text style={styles.month}>{date.toLocaleDateString('en-GH', { month: 'short' })}</Text>
        </View>
        <View style={styles.detailSection}>
          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>IN</Text>
              <Text style={styles.timeValue}>{checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>OUT</Text>
              <Text style={styles.timeValue}>
                {checkOut ? checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </Text>
            </View>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>METHOD</Text>
              <Text style={styles.timeValue}>{item.check_in_method.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.badges}>
            {item.is_late && <View style={styles.lateBadge}><Text style={styles.lateText}>LATE</Text></View>}
            {!item.is_within_geofence && <View style={styles.outsideBadge}><Text style={styles.outsideText}>OUTSIDE</Text></View>}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance History</Text>
        <Text style={styles.subtitle}>{total} records</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a5276" />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No attendance records found</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { padding: 20, paddingTop: 30 },
  title: { fontSize: 24, fontWeight: '700', color: '#2c3e50' },
  subtitle: { fontSize: 13, color: '#95a5a6', marginTop: 4 },
  list: { padding: 20, paddingTop: 0 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  dateSection: {
    width: 56, alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: '#f0f0f0', paddingRight: 12, marginRight: 14,
  },
  dayName: { fontSize: 11, color: '#95a5a6', fontWeight: '600' },
  dayNum: { fontSize: 22, fontWeight: '700', color: '#2c3e50' },
  month: { fontSize: 11, color: '#95a5a6' },
  detailSection: { flex: 1 },
  timeRow: { flexDirection: 'row', gap: 16 },
  timeBlock: {},
  timeLabel: { fontSize: 10, fontWeight: '700', color: '#95a5a6', letterSpacing: 0.5 },
  timeValue: { fontSize: 15, fontWeight: '600', color: '#2c3e50', marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 8 },
  lateBadge: { backgroundColor: '#fff3e0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  lateText: { fontSize: 10, fontWeight: '700', color: '#f39c12' },
  outsideBadge: { backgroundColor: '#ffebee', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  outsideText: { fontSize: 10, fontWeight: '700', color: '#e74c3c' },
  emptyText: { textAlign: 'center', color: '#95a5a6', fontSize: 15, marginTop: 40 },
});
