import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import config from '../utils/config';

export default function LoginScreen({ navigation, setIsLoggedIn }) {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const handleSendOtp = async () => {
    try {
      await axios.post(`${config.BASE_URL}/auth/send-otp`, { email });
      setOtpSent(true);
      Alert.alert('OTP Sent', 'A verification code has been sent to your email.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await axios.post(`${config.BASE_URL}/auth/verify-otp`, { email, otp });
      if (res.data.success) {
        setOtpVerified(true);
        Alert.alert('Verified', 'OTP verified. You can now set your password.');
      } else {
        Alert.alert('Invalid OTP', 'The OTP entered is incorrect.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'OTP verification failed.');
    }
  };

  const handleSetPassword = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    try {
      const res = await axios.post(`${config.BASE_URL}/auth/set-password`, {
        email,
        password,
        otp, // 🔐 used again to confirm legitimacy
      });

      if (res.data.sessionId) {
        await AsyncStorage.setItem('sessionId', res.data.sessionId);
        Alert.alert('Success', 'Account created successfully.');
        setIsSignup(false);
        setOtpSent(false);
        setOtp('');
        setOtpVerified(false);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Password setup failed.');
    }
  };

  const handleLogin = async () => {

  if (!email || !password) {
    Alert.alert('Missing credentials', 'Please enter both email and password.');
    return;
  }

  try {
    const res = await axios.post(`${config.BASE_URL}/auth/login`, {
      email,
      password,
    });

    if (res.data.sessionId) {
      await AsyncStorage.setItem('sessionId', res.data.sessionId);
      setIsLoggedIn(true);
    } else {
      Alert.alert('Login failed', 'No session returned from server.');
    }
  } catch (err) {
    Alert.alert('Login Failed', err.response?.data?.message || 'Login error.');
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{isSignup ? 'Sign Up' : 'Login'}</Text>

      {(!otpSent || !isSignup) && (
  <TextInput
    placeholder="Email"
    style={styles.input}
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
    autoCapitalize="none"
/>
)}

      {isSignup ? (
        <>
          {!otpSent && (
            <View style={styles.button}>
              <Button title="Send OTP" onPress={handleSendOtp} />
            </View>
          )}

          {otpSent && !otpVerified && (
            <>
              <TextInput
                placeholder="Enter OTP"
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
              />
              <View style={styles.button}>
                <Button title="Verify OTP" onPress={handleVerifyOtp} />
              </View>
            </>
          )}

          {otpVerified && (
            <>
              <TextInput
                placeholder="Create Password"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                placeholder="Confirm Password"
                style={styles.input}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <View style={styles.button}>
                <Button title="Set Password" onPress={handleSetPassword} />
              </View>
            </>
          )}
        </>
      ) : (
        <>
          <TextInput
            placeholder="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <View style={styles.button}>
            <Button title="Login" onPress={handleLogin} />
          </View>
        </>
      )}

      <TouchableOpacity
        onPress={() => {
          setIsSignup(!isSignup);
          setOtpSent(false);
          setOtpVerified(false);
          setOtp('');
        }}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: '#007BFF', textAlign: 'center' }}>
          {isSignup ? 'Back to Login' : 'New here? Sign up'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, marginBottom: 30, textAlign: 'center', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  button: { marginTop: 10 },
});
