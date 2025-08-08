import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import config from '../utils/config';

const fetchProviderById = async (providerId) => {
  try {
    const response = await fetch(`${config.BASE_URL}/provider/${providerId}`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Failed to fetch provider:', e);
    return null;
  }
};

const fetchRequestsForProvider = async (pid) => {
  const res = await fetch(`${config.BASE_URL}/requests/${pid}`);
  return res.ok ? await res.json() : [];
};

export default function BookingHistoryScreen() {
  const nav = useNavigation();
  const [sessionId, setSessionId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedPid, setSelectedPid] = useState('');
  const [loading, setLoading] = useState(true);
  const [providerInfos, setProviderInfos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      const sid = await AsyncStorage.getItem('sessionId');
      setSessionId(sid);
      if (!sid) return;

      const uRes = await fetch(`${config.BASE_URL}/user-by-session/${sid}`);
      const user = await uRes.json();
      const infos = user.providerInfos || [];
      setProviderInfos(infos);
    })();
  }, []);

  const loadList = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      if (selectedPid) {
        const reqs = await fetchRequestsForProvider(selectedPid);
        setBookings(reqs);
      } else {
        const res = await fetch(`${config.BASE_URL}/bookings/${sessionId}`);
        setBookings(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [sessionId, selectedPid]);
  const onRefresh = async () => {
  setRefreshing(true);
  await loadList(); 
  setRefreshing(false);
};
  useFocusEffect(
  useCallback(() => {
    const fetchData = async () => {
      await loadList();
    };

    fetchData();
  }, [loadList])
);

  const renderItem = ({ item }) => (
  <View style={styles.card}>
    <Image source={{ uri: item.image }} style={styles.img} />
    <View style={{ flex: 1 }}>
      <Text style={styles.name}>{item.name}</Text>
      <Text>Date: {item.date}</Text>
      <Text>Payment: {item.payment}</Text>
    </View>

    <TouchableOpacity
      style={[styles.btn, { backgroundColor: '#2ecc71' }]}
      onPress={async () => {
        if (!selectedPid) {
          const provider = await fetchProviderById(item.providerId);
          nav.navigate('Booking', { provider });
        } else {
          nav.navigate('ServiceScreen', {
            booking   : item,
            providerId: selectedPid,
          });
        }
      }}
    >
      <Text style={styles.btntxt}>View</Text>
    </TouchableOpacity>
  </View>
);


  const Header = () => (
    providerInfos.length === 0 ? (
      <Text style={styles.header}>My Bookings</Text>
    ) : (
      <>
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setSelectedPid('')}
            style={[styles.tab, !selectedPid && styles.tabActive]}>
            <Text style={styles.tabTxt}>My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => selectedPid || setSelectedPid(providerInfos[0]?.id)}
            style={[styles.tab, selectedPid && styles.tabActive]}>
            <Text style={styles.tabTxt}>Requests For Me</Text>
          </TouchableOpacity>
        </View>

        {selectedPid !== '' && (
          <Picker
            selectedValue={selectedPid}
            style={{ marginTop: 4 }}
            onValueChange={(v) => setSelectedPid(v)}
          >
            {providerInfos.map(info => (
              <Picker.Item
                key={info.id}
                label={info.service}
                value={info.id}
              />
            ))}
          </Picker>
        )}
      </>
    )
  );

  return (
    <View style={styles.container}>
      <Header />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : bookings.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          {selectedPid ? 'No requests yet.' : 'No bookings found.'}
        </Text>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabs: { flexDirection: 'row', marginBottom: 8 },
  tab: {
    flex: 1, padding: 8,
    borderBottomWidth: 2, borderColor: 'transparent',
    alignItems: 'center'
  },
  tabActive: { borderColor: '#2ecc71' },
  tabTxt: { fontWeight: '600' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: {
    flexDirection: 'row', padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8, marginBottom: 10,
    alignItems: 'center'
  },
  img: { width: 60, height: 60, borderRadius: 8, marginRight: 8 },
  name: { fontSize: 18, fontWeight: '600' },
  btn: {
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 6, marginLeft: 6
  },
  btntxt: { color: '#fff', fontSize: 12 }
});
