import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import config from '../utils/config';

const WorkerApplicationScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [service, setService] = useState('');
  const [location, setLocation] = useState(null);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is needed');
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude
    });
    Alert.alert('Location Set', `Lat: ${loc.coords.latitude}, Lng: ${loc.coords.longitude}`);
  };

  const handleSubmit = async () => {
    if (!fullName || !phone || !skills || !service || !location) {
      Alert.alert('Required', 'Please fill in all required fields including location.');
      return;
    }

    const sessionId = await AsyncStorage.getItem('sessionId');
    if (!sessionId) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    const payload = {
      sessionId,
      application: {
        fullName,
        phone,
        address,
        skills,
        experience,
        image: imageUrl,
        service: service.trim(),
        lat: location.latitude,
        lng: location.longitude,
      },
    };

    try {
      const res = await fetch(`${config.BASE_URL}/apply-worker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        Alert.alert('Info', 'You already have a pending application.');
        navigation.goBack();
        return;
      }

      if (!res.ok) throw new Error('submit failed');
      Alert.alert('Success', 'Application submitted.');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not submit application.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Worker Application</Text>

        <TextInput placeholder="Full Name *" style={styles.input} value={fullName} onChangeText={setFullName} />
        <TextInput placeholder="Phone *" keyboardType="phone-pad" style={styles.input} value={phone} onChangeText={setPhone} />
        <TextInput placeholder="Address" style={[styles.input, { height: 80 }]} multiline value={address} onChangeText={setAddress} />
        <TextInput placeholder="Skills / Expertise *" style={styles.input} value={skills} onChangeText={setSkills} />
        <TextInput placeholder="Experience (years)" style={styles.input} keyboardType="numeric" value={experience} onChangeText={setExperience} />
        <TextInput placeholder="Profile Image URL (optional)" style={styles.input} value={imageUrl} onChangeText={setImageUrl} />
        <TextInput placeholder="Service you want to provide * (e.g., Electrician)" style={styles.input} value={service} onChangeText={setService} />

        <TouchableOpacity style={styles.locationBtn} onPress={getLocation}>
          <Text style={styles.btnText}>📍 Set Current Location</Text>
        </TouchableOpacity>
        {location && (
          <Text style={{ marginTop: 6 }}>Selected Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.btnText}>Submit Application</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    padding: 10, marginBottom: 12
  },
  submitBtn: {
    backgroundColor: '#2ecc71', padding: 14,
    borderRadius: 6, alignItems: 'center', marginTop: 12,
  },
  locationBtn: {
    backgroundColor: '#3498db', padding: 12,
    borderRadius: 6, alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
});

export default WorkerApplicationScreen;
