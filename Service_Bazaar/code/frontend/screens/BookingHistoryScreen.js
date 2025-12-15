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

// Helper function to group bookings by date
const groupBookingsByDate = (bookings) => {
  const grouped = bookings.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  // Convert to array and sort by date (newest first)
  return Object.entries(grouped)
    .sort(([a], [b]) => new Date(b) - new Date(a))
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => {
        // Sort items within same date by arrival time
        return b.arrivalTime?.localeCompare(a.arrivalTime) || 0;
      })
    }));
};

// Helper function to format date for display
const formatDateHeader = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check if it's today or yesterday
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    // Format as "Mon, Dec 25, 2023"
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

export default function BookingHistoryScreen() {
  const nav = useNavigation();
  const [sessionId, setSessionId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [groupedBookings, setGroupedBookings] = useState([]);
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

  // Group bookings whenever bookings array changes
  useEffect(() => {
    if (bookings.length > 0) {
      const grouped = groupBookingsByDate(bookings);
      setGroupedBookings(grouped);
    } else {
      setGroupedBookings([]);
    }
  }, [bookings]);

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

  const renderBookingItem = (item) => (
    <View key={item.id} style={styles.card}>
      <Image 
        source={{ 
          uri: selectedPid 
            ? 'https://icons.veryicon.com/png/o/miscellaneous/administration/account-25.png'
            : item.image || 'https://icons.veryicon.com/png/o/miscellaneous/administration/account-25.png'
        }} 
        style={styles.img} 
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{selectedPid ? item.username : item.name}</Text>
        <Text>Time: {item.arrivalTime || 'N/A'}</Text>
        <Text>
          {item.state === 'completed' ? 'Service Completed' : selectedPid? `${item.payment}` : `Service: ${item.service}`}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#2ecc71' }]}
        onPress={async () => {
          if (!selectedPid) {
            /* ── USER MODE ───────────────────────── */
            const provider = await fetchProviderById(item.providerId);
            if (provider) {
              nav.navigate('Booking', { 
                provider, 
                booking: item
              });
            } else {
              console.error('Provider not found for ID:', item.providerId);
            }
          } else {
            /* ── PROVIDER MODE ───────────────────── */
            nav.navigate('ServiceScreen', {
              booking: item,
              providerId: selectedPid,
            });
          }
        }}
      >
        <Text style={styles.btntxt}>View</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDateSection = ({ item: dateSection }) => (
    <View key={dateSection.date}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateHeaderText}>{formatDateHeader(dateSection.date)}</Text>
      </View>
      {dateSection.items.map(renderBookingItem)}
    </View>
  );

  // Flatten the grouped data for FlatList
  const flattenedData = groupedBookings.map(section => ({
    id: section.date,
    type: 'section',
    ...section
  }));

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
          data={flattenedData}
          keyExtractor={(item) => item.id}
          renderItem={renderDateSection}
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
  dateHeader: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
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