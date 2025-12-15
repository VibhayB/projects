import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../utils/config';

const ProviderBookingsScreen = ({ route, navigation }) => {
  const { provider, bookings: initialBookings } = route.params;
  const [bookings, setBookings] = useState(initialBookings);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      const id = await AsyncStorage.getItem('sessionId');
      setSessionId(id);
    };
    loadSession();
  }, []);

  const fetchBookings = async () => {
    if (!sessionId) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`${config.BASE_URL}/bookings/${sessionId}`);
      const allBookings = await response.json();
      
      const providerBookings = allBookings.filter(b => b.providerId === provider.id);
      setBookings(providerBookings);
    } catch (e) {
      console.error('Error fetching bookings:', e);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusStyle = (status) => {
    const statusStyles = {
      'request sent': { backgroundColor: '#fff3cd', color: '#856404' },
      'confirmed': { backgroundColor: '#d1ecf1', color: '#0c5460' },
      'double confirmed': { backgroundColor: '#d4edda', color: '#155724' },
      'completed': { backgroundColor: '#e2e3e5', color: '#383d41' },
      'cancelled': { backgroundColor: '#f8d7da', color: '#721c24' },
    };
    
    return statusStyles[status] || statusStyles['request sent'];
  };

  const renderBookingItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.state);
    
    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => navigation.navigate('Booking', { 
          provider, 
          booking: item 
        })}
      >
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingDate}>{item.date}</Text>
          <Text style={[styles.statusBadge, statusStyle]}>
            {item.state}
          </Text>
        </View>
        
        <Text style={styles.bookingTime}>Time: {item.arrivalTime}</Text>
        <Text style={styles.bookingDuration}>Duration: {item.duration} hours</Text>
        <Text style={styles.bookingPayment}>Payment: {item.payment}</Text>
        
        {item.state === 'double confirmed' && (
          <Text style={styles.otpText}>OTP: {item.otpUser}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings with {provider.name}</Text>
        <Text style={styles.subtitle}>{bookings.length} booking(s)</Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id || Math.random().toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchBookings}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>
              You haven't booked this provider yet
            </Text>
          </View>
        }
        contentContainerStyle={bookings.length === 0 ? { flex: 1, justifyContent: 'center' } : {}}
      />

      <TouchableOpacity
        style={styles.newBookingButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.newBookingText}>Book Again</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    padding: 20, 
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4, textAlign: 'center' },
  bookingCard: {
    backgroundColor: 'white',
    padding: 16,
    margin: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingDate: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingTime: { fontSize: 14, color: '#666', marginBottom: 4 },
  bookingDuration: { fontSize: 14, color: '#666', marginBottom: 4 },
  bookingPayment: { fontSize: 14, color: '#666', marginBottom: 4 },
  otpText: { fontSize: 14, color: '#007BFF', fontWeight: 'bold', marginTop: 8 },
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 40 
  },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#999' },
  newBookingButton: {
    backgroundColor: '#007BFF',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  newBookingText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default ProviderBookingsScreen;