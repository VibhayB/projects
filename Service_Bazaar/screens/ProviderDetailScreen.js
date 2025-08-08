import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Button,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import config from '../utils/config';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const ProviderDetailScreen = ({ route, navigation }) => {
  const { provider } = route.params || {};
  const [booked, setBooked] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(new Date());
const [showDatePicker, setShowDatePicker] = useState(false);
const [showTimePicker, setShowTimePicker] = useState(false);

// Formatting helpers
const formatDate = d => d.toISOString().split('T')[0];
const formatTime = d => d.toTimeString().slice(0, 5);

  const [sessionId, setSessionId] = useState(null);


  
useEffect(() => {
  const loadSession = async () => {
    const id = await AsyncStorage.getItem('sessionId');
    setSessionId(id);
  };
  loadSession();
}, []);

useEffect(() => {
  if (!provider || !sessionId) return;

  const checkBookingStatus = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/bookings/${sessionId}`);
      const data = await response.json();

      const isBooked = data.some(b => b.providerId === provider.id); // ✅ Corrected
      setBooked(isBooked);
    } catch (e) {
      console.error('Error checking booking status:', e);
    }
  };

  checkBookingStatus();
}, [sessionId, provider]);




  const handleBooking = () => {
  if (booked) {
    navigation.navigate('Booking', {provider});
  } else {
    setShowBookingDetailsModal(true); // Show custom modal before payment
  }
};



  const handleCashBooking = async () => {
    const formattedDate = formatDate(date);
  const formattedTime = formatTime(date);
  try {
    if (!sessionId) return Alert.alert('Error', 'User not authenticated.');

    const { id: providerId, ...rest } = provider;

const bookingWithDate = {
  ...rest,
  providerId,
  date: formattedDate,
  arrivalTime: formattedTime,
  duration,
  payment: 'Cash after Service',
  sessionId,
};


    const res = await fetch(`${config.BASE_URL}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingWithDate),
    });

    const json = await res.json();
    if (res.ok) {
      setBooked(true);
      navigation.navigate('Booking', {provider});
      Alert.alert('Booking Confirmed', `${provider.name} has been booked.`);
    } else {
      Alert.alert('Booking Failed', json.message || 'Try again.');
    }
  } catch (e) {
    console.error(e);
    Alert.alert('Error', 'Could not complete booking.');
  }
};


  const handleOnlinePayment = () => {
    const options = {
      description: 'Service Payment',
      image: 'https://your-logo-url.com/logo.png',
      currency: 'INR',
      key: 'YOUR_RAZORPAY_KEY', //should be on server side instead
      amount: '50000', // 500.00 INR
      name: provider.name,
      prefill: {
        email: 'example@email.com',
        contact: '9999999999',
        name: 'Your Name',
      },
      theme: { color: '#53a20e' },
    };

    RazorpayCheckout.open(options)
      .then(async (data) => {

        
    const formattedDate = formatDate(date);
  const formattedTime = formatTime(date);

const { id: providerId, ...rest } = provider;

const bookingWithDate = {
  ...rest,
  providerId,
  date: formattedDate,
  arrivalTime: formattedTime,
  duration,
  payment: 'Paid Online',
  paymentId: data.razorpay_payment_id,
  sessionId,
};


await fetch(`${config.BASE_URL}/book`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bookingWithDate),
});

setBooked(true);
Alert.alert('Payment Success', `${provider.name} has been booked.`);

      })
      .catch(error => {
        Alert.alert('Payment Failed', 'Transaction was not completed.');
        console.error('Payment error:', error);
      });
  };

  if (!provider) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>Provider details not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: provider.image }} style={styles.image} />
      <Text style={styles.name}>{provider.name}</Text>
      <Text style={styles.service}>Service: {capitalize(provider.service)}</Text>
      <Text>⭐ {provider.rating} ({provider.totalRating} ratings)</Text>
      <Text>Successful Services: {provider.successfulServices}</Text>

      <View style={styles.button}>
        <Button
          title={booked ? 'View Booking' : 'Book Now'}
          onPress={handleBooking}
          color={booked ? '#e74c3c' : '#007BFF'}
        />
      </View>

      {/* Comments */}
      <Text style={styles.commentsTitle}>Customer Comments</Text>
      {provider.comments?.length === 0 ? (
        <Text style={styles.noComments}>No comments yet.</Text>
      ) : (
        <FlatList
          data={provider.comments}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.commentBox}>
              <Text style={styles.commentText}>"{item.comment}"</Text>
              <Text style={styles.commentAuthor}>— {item.name}</Text>
            </View>
          )}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Mode</Text>
            <Text style={{ marginBottom: 16, textAlign: 'center' }}>
              How would you like to pay?
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowPaymentModal(false);
                handleCashBooking();
              }}
              style={[styles.modalButton, { backgroundColor: '#27ae60' }]}
            >
              <Text style={styles.modalButtonText}>Cash after Service</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowPaymentModal(false);
                handleOnlinePayment();
              }}
              style={[styles.modalButton, { backgroundColor: '#2980b9' }]}
            >
              <Text style={styles.modalButtonText}>Online Payment Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPaymentModal(false)}
              style={[styles.modalButton, { backgroundColor: '#e74c3c' }]}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showBookingDetailsModal && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Booking Details</Text>

      {/* Booking Date Picker */}
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.input}
      >
        <Text>{`Date: ${formatDate(date)}`}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {/* Arrival Time Picker */}
      <TouchableOpacity
        onPress={() => setShowTimePicker(true)}
        style={styles.input}
      >
        <Text>{`Arrival Time: ${formatTime(date)}`}</Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={(_, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              const updated = new Date(date);
              updated.setHours(selectedTime.getHours());
              updated.setMinutes(selectedTime.getMinutes());
              setDate(updated);
            }
          }}
        />
      )}

      <TextInput
        placeholder="Duration (in hours)"
        keyboardType="numeric"
        style={styles.input}
        value={duration}
        onChangeText={setDuration}
      />

      <TouchableOpacity
        onPress={() => {
          
          const formattedDate = formatDate(date);
const formattedTime = formatTime(date);

if (!formattedDate) {
  Alert.alert('Date is required.');
  return;
}
if (!formattedTime) {
  Alert.alert('Time is required.');
  return;
}
if (!duration) {
  Alert.alert('Duration is required.');
  return;
}

setBookingDate(formattedDate);
setArrivalTime(formattedTime);
setShowBookingDetailsModal(false);
setShowPaymentModal(true);

        }}
        style={[styles.modalButton, { backgroundColor: '#27ae60' }]}
      >
        <Text style={styles.modalButtonText}>Continue to Payment</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setShowBookingDetailsModal(false)}
        style={[styles.modalButton, { backgroundColor: '#e74c3c' }]}
      >
        <Text style={styles.modalButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
)}
    </SafeAreaView>
  );
};

const capitalize = (str = '') =>
  str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20 },
  image: { width: 120, height: 120, borderRadius: 60, marginBottom: 20 },
  name: { fontSize: 24, fontWeight: 'bold' },
  service: { fontSize: 16, color: '#444', marginBottom: 4 },
  button: { marginTop: 20, width: '60%' },
  commentsTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 30, marginBottom: 10, alignSelf: 'flex-start' },
  noComments: { fontStyle: 'italic', color: '#666', alignSelf: 'flex-start' },
  commentBox: { backgroundColor: '#f2f2f2', padding: 10, borderRadius: 8, marginVertical: 5, width: '100%' },
  commentText: { fontSize: 14, color: '#333' },
  commentAuthor: { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'right' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 12, padding: 20, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalButton: { padding: 12, borderRadius: 6, marginTop: 10, alignItems: 'center' },
  modalButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  checkboxContainer: { paddingVertical: 6 },
  checkbox: { fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginTop: 10, borderRadius: 5 },
  okButton: { backgroundColor: '#2ecc71', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, marginTop: 16 },
  okButtonText: { color: 'white', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
});

export default ProviderDetailScreen;
