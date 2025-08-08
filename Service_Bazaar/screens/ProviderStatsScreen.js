import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import config from '../utils/config';

const ProviderStatsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [providerIds, setProviderIds] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // default YYYY-MM
  const [stats, setStats] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      const sid = await AsyncStorage.getItem('sessionId');
      setSessionId(sid);
      const prof = await fetch(`${config.BASE_URL}/profile/${sid}`).then(r => r.json());
      if (prof?.providerIds?.length) setProviderIds(prof.providerIds);
    })();
  }, []);

  useEffect(() => {
    if (!providerIds.length || !month) return;

    const fetchStats = async () => {
      setLoading(true);
      const result = {};

      for (let pid of providerIds) {
        try {
          const res = await fetch(`${config.BASE_URL}/provider-stats/${pid}?month=${month}`);
          const data = await res.json();
          result[pid] = data;
        } catch (err) {
          result[pid] = { error: 'Error fetching stats' };
        }
      }

      setStats(result);
      setLoading(false);
    };

    fetchStats();
  }, [providerIds, month]);

  const months = [...Array(12).keys()].map(i => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7); // YYYY-MM
  });

  const onRefresh = async () => {
  setRefreshing(true);

  try {
    const result = {};
    for (let pid of providerIds) {
      try {
        const res = await fetch(`${config.BASE_URL}/provider-stats/${pid}?month=${month}`);
        const data = await res.json();
        result[pid] = data;
      } catch (err) {
        result[pid] = { error: 'Error fetching stats' };
      }
    }
    setStats(result);
  } catch (err) {
    console.error('Refresh error:', err);
  } finally {
    setRefreshing(false);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Monthly Stats</Text>

      <Picker
        selectedValue={month}
        onValueChange={setMonth}
        style={styles.picker}
      >
        {months.map(m => (
          <Picker.Item key={m} label={m} value={m} />
        ))}
      </Picker>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={providerIds}
          keyExtractor={id => id}
          renderItem={({ item }) => {
            const stat = stats[item];
            if (!stat) return null;

            return (
              <View style={styles.card}>
                <Text style={styles.title}>Provider ID: {item}</Text>
                {stat.error ? (
                  <Text style={styles.error}>{stat.error}</Text>
                ) : (
                  <>
                    <Text>Total Bookings: {stat.total}</Text>
                    <Text>Completed: {stat.completed}</Text>
                    <Text>Cancelled: {stat.cancelled}</Text>
                    <Text>Revenue: ₹{stat.revenue}</Text>
                  </>
                )}
              </View>
            );
          }}
          refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  picker: { marginBottom: 20 },
  card: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  title: { fontWeight: 'bold', marginBottom: 4 },
  error: { color: 'red' },
});

export default ProviderStatsScreen;
