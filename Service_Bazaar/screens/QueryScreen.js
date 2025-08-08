// QueryScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../utils/config';

export default function QueryScreen({ navigation }) {
  const [threads, setThreads] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const fetchThreads = useCallback(async (sid) => {
    if (!sid) return;

    try {
      const res = await fetch(`${config.BASE_URL}/query-threads/${sid}`);
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setThreads([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const sid = await AsyncStorage.getItem('sessionId');
      setSessionId(sid);
      fetchThreads(sid);
    })();
  }, [fetchThreads]);

  const onRefresh = async () => {
    if (!sessionId) return;
    setRefreshing(true);
    await fetchThreads(sessionId);
    setRefreshing(false);
  };

  const ThreadRow = ({ item }) => (
    <TouchableOpacity
      style={styles.thread}
      onPress={() => navigation.navigate('QueryChat', { threadId: item.threadId })}
    >
      <View>
        <Text style={styles.title}>{item.title || 'Query'}</Text>
        <Text numberOfLines={1} style={styles.preview}>
          {item.lastMessage || 'Tap to view conversation'}
        </Text>
      </View>
      <Text style={styles.view}>View ›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={threads}
        keyExtractor={(item) => item.threadId}
        renderItem={ThreadRow}
        ListHeaderComponent={<Text style={styles.header}>Queries</Text>}
        ListEmptyComponent={<Text style={styles.empty}>No queries yet</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <TouchableOpacity
        style={styles.newBtn}
        onPress={() => navigation.navigate('QueryChat', { newChat: true })}
      >
        <Text style={styles.newTxt}>New Query</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ───────────── styles ───────────── */
const styles = StyleSheet.create({
  container : { flex: 1, padding: 16 },
  header    : { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  thread    : { flexDirection:'row', justifyContent:'space-between',
                alignItems:'center', padding:12, borderRadius:6,
                backgroundColor:'#f0f0f0', marginVertical:6 },
  title     : { fontSize: 16, fontWeight: '600' },
  preview   : { color: '#555', marginTop: 4 },
  view      : { color: '#3498db', fontWeight: '600' },
  newBtn    : { backgroundColor:'#2ecc71', padding:12, borderRadius:6,
                alignItems:'center', marginTop:14 },
  newTxt    : { color: '#fff', fontWeight:'bold' },
  empty     : { textAlign:'center', marginTop: 12, color:'#888' },
});
