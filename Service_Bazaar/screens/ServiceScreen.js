// ServiceScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet,
  TouchableOpacity, ScrollView, Alert, TextInput, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import config from '../utils/config';
import { Ionicons } from '@expo/vector-icons';

export default function ServiceScreen({ route, navigation }) {
  const { booking, providerId } = route.params;
  const [status, setStatus] = useState(booking.state);
  const [details, setDetails] = useState(booking); // ✅ use this throughout
  const [refreshing, setRefreshing] = useState(false);

  const fetchLatest = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${config.BASE_URL}/booking/${booking.id}`);
      if (res.ok) {
        const fresh = await res.json();
        setDetails(fresh);
        setStatus(fresh.state);
      }
    } catch (e) {
      console.warn('Could not refresh booking', e);
    } finally {
      setRefreshing(false);
    }
  }, [booking.id]);

  useFocusEffect(
    useCallback(() => {
      fetchLatest();
    }, [fetchLatest])
  );

  const [enteredUserOtp, setEnteredUserOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const updateStatus = async (newState, endpoint) => {
    try {
      const res = await fetch(`${config.BASE_URL}/requests/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, bookingId: booking.id })
      });
      if (!res.ok) throw new Error();
      setStatus(newState);
      Alert.alert('Success', `Booking ${newState}.`);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Action failed, try again.');
    }
  };

  const verifyUserOtp = async () => {
    if (enteredUserOtp.length !== 6) {
      Alert.alert('Invalid OTP', 'OTP must be 6 digits');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${config.BASE_URL}/verify-user-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, otp: enteredUserOtp })
      });
      const out = await res.json();
      if (res.ok && out.success) {
        setStatus('double confirmed');
        Alert.alert('Success', 'Customer OTP verified – job double-confirmed!');
        navigation.goBack();
      } else {
        Alert.alert('Error', out.message || 'Incorrect OTP');
      }
    } catch {
      Alert.alert('Error', 'Server error verifying OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchLatest} />
        }
      >
        <View style={styles.bookingCard}>
          <Text style={styles.aboutTitle}>Booking Request</Text>

          <View style={{ alignItems: 'center', width: '100%' }}>
            <Image source={{ uri: details.image }} style={styles.image} />
          </View>

          <Text style={styles.label}><Text style={styles.bold}>Customer:</Text> {details.name}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Service:</Text> {details.service}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Status:</Text> {status}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Date:</Text> {details.date}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Arrival Time:</Text> {details.arrivalTime}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Duration:</Text> {details.duration} hour(s)</Text>
          <Text style={styles.label}><Text style={styles.bold}>Payment:</Text> {details.payment}</Text>

          {details.otpProvider && (
            <Text style={styles.label}>
              <Text style={styles.label}><Text style={styles.bold}>Your OTP for Customer:</Text></Text>{details.otpProvider}
            </Text>
          )}
        </View>

        {/* 🔵 Chat Button */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: '#8e44ad', marginTop: 30 }]}
          onPress={() =>
            navigation.navigate('BookingChat', {
              bookingId: booking.id,
              sender: 'provider',
            })
          }
        >
          <Text style={styles.okText}>Chat with Customer</Text>
        </TouchableOpacity>

        {status === 'request sent' && (
          <>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#27ae60' }]}
              onPress={() => updateStatus('approved', 'approve')}
            >
              <Text style={styles.okText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#e74c3c', marginTop: 16 }]}
              onPress={() => updateStatus('booking cancelled', 'cancel')}
            >
              <Text style={styles.okText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'confirmed' && (
          <View style={{ width: '90%', marginTop: 20 }}>
            <Text style={styles.label}>Enter Customer’s OTP:</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit OTP"
              keyboardType="numeric"
              maxLength={6}
              value={enteredUserOtp}
              onChangeText={setEnteredUserOtp}
            />
            <TouchableOpacity
              style={[styles.submitBtn, { marginTop: 10 }]}
              onPress={verifyUserOtp}
            >
              <Text style={styles.okText}>
                {otpLoading ? 'Verifying…' : 'Verify OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: 120, height: 120, borderRadius: 60, marginTop: 20, marginBottom: 20 },
  aboutTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  bookingCard: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 12, width: '90%', marginTop: 20 },
  label: { fontSize: 16, marginVertical: 4, color: '#333' },
  bold: { fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginTop: 6 },
  submitBtn: {
    padding: 12,
    borderRadius: 6,
    width: '60%',
    alignItems: 'center',
    backgroundColor: '#2ecc71',
  },
  okText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
