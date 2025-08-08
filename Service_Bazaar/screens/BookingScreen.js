import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import config from '../utils/config';

const BookingScreen = ({ route, navigation }) => {
  const { provider } = route.params || {};
  const [booked, setBooked] = useState(true); 
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [otherReason, setOtherReason] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [enteredProviderOtp, setEnteredProviderOtp] = useState('');
const [otpCheckLoading, setOtpCheckLoading] = useState(false);

  const [sessionId, setSessionId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

const fetchLatestBooking = async () => {
  if (!sessionId || !provider?.id) return;
  setRefreshing(true);
  try {
    const res = await fetch(`${config.BASE_URL}/bookings/${sessionId}`);
    const list = await res.json();
    const fresh = list.find(b => b.providerId === provider.id);
    if (fresh) {
      setBookingDetails(fresh);
      setBooked(true);
    } else {
      setBooked(false);
    }
  } catch (e) {
    console.warn('Error refreshing booking:', e);
  } finally {
    setRefreshing(false);
  }
};

  const reasonOptions = [
    'Found a better provider',
    'Change of plans',
    'Accidental booking',
    'Too expensive',
    'Others',
  ];
  
const hasQuarterPassed = (b) => {
  if (!b) return false;
  const start   = new Date(`${b.date}T${b.arrivalTime}:00`).getTime();
  const now     = Date.now();
  const durMin  = parseInt(b.duration || '1', 10) * 60;    
  const quarter = start + durMin * 0.25 * 60 * 1000;        
  return now >= quarter;
};

 useEffect(() => {
  const loadBookingDetails = async () => {
    const id = await AsyncStorage.getItem('sessionId');
    setSessionId(id);

    try {
      const response = await fetch(`${config.BASE_URL}/bookings/${id}`);
      const bookings = await response.json();

      const thisBooking = bookings.find(b => b.providerId === provider.id);
      if (thisBooking) {
        setBookingDetails(thisBooking);   
        setBooked(true);
      } else {
        setBooked(false);
      }
    } catch (e) {
      console.error('Error loading bookings:', e);
    }
  };

  if (provider) {
    loadBookingDetails();
  }
}, [provider]);



  const handleUnbooking = async () => {
    setBooked(false);
    setShowCancelModal(true);
      
  };

  if (!provider || !sessionId) {
  return (
    <View style={styles.container}>
      <Text style={{ color: 'red' }}>Loading...</Text>
    </View>
  );
}


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
  contentContainerStyle={{ alignItems: 'center', paddingBottom: 50 }}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={fetchLatestBooking} />
  }
>


        {bookingDetails ? (
    <View style={styles.bookingCard}>
      <Text style={styles.aboutTitle}>About Booking</Text>

      <View style={{ alignItems: 'center', width: '100%' }}>
  <Image source={{ uri: provider.image }} style={styles.image} />
</View>


      <Text style={styles.label}><Text style={styles.bold}>Provider:</Text> {provider.name}</Text>
      <Text style={styles.label}><Text style={styles.bold}>Service:</Text> {capitalize(provider.service)}</Text>
      <Text style={styles.label}><Text style={styles.bold}>Rating:</Text> ⭐ {provider.rating} ({provider.totalRating} ratings)</Text>
      <Text style={styles.label}><Text style={styles.bold}>Successful Services:</Text> {provider.successfulServices}</Text>
      
      <Text style={styles.label}><Text style={styles.bold}>Status:</Text> {bookingDetails.state}</Text>
      <Text style={styles.label}><Text style={styles.bold}>Date:</Text> {bookingDetails.date}</Text>
      <Text style={styles.label}><Text style={styles.bold}>Arrival Time:</Text> {bookingDetails.arrivalTime}</Text>
      <Text style={styles.label}><Text style={styles.bold}>Duration:</Text> {bookingDetails.duration} hour(s)</Text>
      <Text style={styles.label}><Text style={styles.bold}>Payment Mode:</Text> {bookingDetails.payment}</Text>
      {bookingDetails?.otpUser && (
  <Text style={styles.label}><Text style={styles.bold}>OTP for Provider:</Text>  {bookingDetails.otpUser}</Text>
)} 

 {bookingDetails?.otpUser && ['approved', 'confirmed'].includes(bookingDetails.state) && (
<View style={{ width: '100%', marginTop: 20 }}>
  <Text style={styles.label}>Enter OTP from Provider:</Text>
  <TextInput
    style={styles.input}
    placeholder="Enter 6-digit OTP"
    keyboardType="numeric"
    value={enteredProviderOtp}
    onChangeText={setEnteredProviderOtp}
    maxLength={6}
  />

  <TouchableOpacity
    style={[styles.submitBtn, { marginTop: 10, width: '100%' }]}
    onPress={async () => {
      if (enteredProviderOtp.length !== 6) {
        Alert.alert('Invalid OTP', 'OTP must be 6 digits');
        return;
      }

      setOtpCheckLoading(true);

      try {
        const res = await fetch(`${config.BASE_URL}/verify-provider-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: bookingDetails.id,
            otp: enteredProviderOtp,
          }),
        });

        const result = await res.json();

        if (res.ok && result.success) {
          Alert.alert('OTP Verified', 'Provider OTP matched successfully!');
        } else {
          Alert.alert('Invalid OTP', result.message || 'OTP did not match');
        }
      } catch (e) {
        Alert.alert('Error', 'Something went wrong during OTP verification.');
        console.error('OTP verification error:', e);
      } finally {
        setOtpCheckLoading(false);
      }
    }}
  >
    <Text style={styles.okText}>
      {otpCheckLoading ? 'Verifying...' : 'Verify Provider OTP'}
    </Text>
  </TouchableOpacity>
</View>
)} 

    </View>
    
  ) : booked ? (
    <Text>Loading booking details...</Text>
  ) : (
    <Text>No booking found for this provider.</Text>
  )}

<TouchableOpacity
    onPress={() => navigation.navigate('ProviderDetail', { provider })}
    style={[styles.submitBtn, { backgroundColor: '#3498db', marginTop: 30 }]}
  >
    <Text style={styles.okText}>About Provider</Text>
  </TouchableOpacity>

        {bookingDetails && !(['request sent','completed','completed rated'].includes(bookingDetails.state)) && (
  <TouchableOpacity
  onPress={() => navigation.navigate('BookingChat', {
    bookingId: bookingDetails.id,
    sender: 'user',
  })}
  style={[styles.submitBtn, { backgroundColor: '#8e44ad', marginTop: 30 }]}
>
  <Text style={styles.okText}>Chat with Provider</Text>
</TouchableOpacity>

)}

{booked && bookingDetails && (
  <>
    {(
      !(bookingDetails.state == 'double confirmed' && hasQuarterPassed(bookingDetails)) && !(['completed','completed rated'].includes(bookingDetails.state))) && (
      <TouchableOpacity
        onPress={() =>
          Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel your booking?',
            [
              { text: 'Yes', onPress: handleUnbooking, style: 'destructive' },
              { text: 'No',  style: 'cancel' },
            ]
          )
        }
        style={[styles.submitBtn, { backgroundColor: '#e74c3c', marginTop: 30 }]}
      >
        <Text style={styles.okText}>Cancel Booking</Text>
      </TouchableOpacity>
    )}

    {/* Done button AFTER ¼-time AND state is confirmed */}
    {['double confirmed'].includes(bookingDetails.state) && hasQuarterPassed(bookingDetails) && (
      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: '#27ae60', marginTop: 30 }]}
        onPress={async () => {
          try {
            const res = await fetch(`${config.BASE_URL}/mark-done`, {  
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookingId: bookingDetails.id }),
            });
            const out = await res.json();
            if (res.ok && out.success) {
              Alert.alert('Thank you!', 'Service marked as completed.');
              navigation.goBack();
            } else {
              Alert.alert('Error', out.message || 'Could not mark done.');
            }
          } catch (err) {
            console.error('Done error:', err);
            Alert.alert('Error', 'Server problem.');
          }
        }}
      >
        <Text style={styles.okText}>Done</Text>
      </TouchableOpacity>
    )}
  </>
)}

      </ScrollView>

            {showCancelModal && (
              <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                  <Text style={styles.modalTitle}>Booking Cancelled</Text>
                  <Text>Your booking has been cancelled successfully.</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowCancelModal(false);
                      setShowReasonModal(true);
                    }}
                    style={styles.modalOK}
                  >
                    <Text style={styles.okText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            

            {showReasonModal && (
              <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                  <Text style={styles.modalTitle}>Reason for Unbooking</Text>
                  {reasonOptions.slice(0, 4).map((reason, index) => (
  <TouchableOpacity
    key={index}
    onPress={() =>
      setSelectedReasons(prev =>
        prev.includes(reason)
          ? prev.filter(r => r !== reason)
          : [...prev, reason]
      )
    }
  >
    <Text style={{ marginVertical: 6, fontSize: 16 }}>
                        {selectedReasons.includes(reason) ? '☑' : '☐'} {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}

      
                  <TextInput
                    style={styles.textInput}
                    placeholder="Other reason (optional)"
                    value={otherReason}
                    onChangeText={setOtherReason}
                  />
      
                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity
  onPress={async () => {
    const allReasons = [...selectedReasons];
    if (otherReason.trim()) {
      allReasons.push(otherReason.trim());
    }

    try {
      const response = await fetch(`${config.BASE_URL}/unbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          bookingId: bookingDetails?.id,  
          reasons: allReasons,
        }),
      });

      if (response.ok) {
        setShowReasonModal(false);
        setSelectedReasons([]);
        setOtherReason('');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to submit reason.');
      }
    } catch (error) {
      console.error('Error submitting reason:', error);
      Alert.alert('Error', 'Something went wrong.');
    }
  }}
  style={styles.submitBtn}
>
  <Text style={styles.okText}>Done</Text>
</TouchableOpacity>

                  </View>
                </View>
              </View> 
            )}
    </SafeAreaView>
  );
};

const capitalize = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: 120, height: 120, borderRadius: 60, marginTop: 20, marginBottom: 20 },
  name: { fontSize: 24, fontWeight: 'bold' },
  service: { fontSize: 16, color: '#444', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },orderBox: {
  backgroundColor: '#f9f9f9',
  padding: 15,
  borderRadius: 8,
  marginTop: 20,
  width: '90%',
  alignSelf: 'center',
},
orderTitle: {
  fontWeight: 'bold',
  fontSize: 16,
  marginBottom: 8,
},

aboutTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 20,
  textAlign: 'center',
},
bookingCard: {
  backgroundColor: '#f9f9f9',
  padding: 20,
  borderRadius: 12,
  width: '90%',
  marginTop: 20,
},
label: {
  fontSize: 16,
  marginVertical: 4,
  color: '#333',
},
bold: {
  fontWeight: 'bold',
},

  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
  },
  modalBox: {
    backgroundColor: 'white', padding: 20, borderRadius: 10, width: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalOK: {
    backgroundColor: '#2ecc71', padding: 10, borderRadius: 6, marginTop: 16
  },
  okText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  textInput: {
    borderWidth: 1, borderColor: '#ccc', padding: 8, marginTop: 10, borderRadius: 5
  },
  modalBtnRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 16
  },
  submitBtn: {
    backgroundColor: '#2ecc71', padding: 10, borderRadius: 6, width: '45%'
  },
});

export default BookingScreen;
