import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import config from '../utils/config';

const WorkerApplicationScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [service, setService] = useState('');
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const getDetailedLocationName = async (latitude, longitude, retries = 3, delay = 1000) => {
    // Validate coordinates
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      console.error('Invalid coordinates:', { latitude, longitude });
      return 'Invalid location data';
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'WorkerApp/1.0 (contact@workerapp.com)',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (data.display_name) {
          const addr = data.address;
          let detailedAddress = '';
          
          // Build a comprehensive address string
          if (addr.house_number) detailedAddress += `${addr.house_number} `;
          if (addr.road) detailedAddress += `${addr.road}, `;
          if (addr.neighbourhood) detailedAddress += `${addr.neighbourhood}, `;
          if (addr.suburb) detailedAddress += `${addr.suburb}, `;
          if (addr.city_district) detailedAddress += `${addr.city_district}, `;
          if (addr.city) detailedAddress += `${addr.city}, `;
          if (addr.county) detailedAddress += `${addr.county}, `;
          if (addr.state) detailedAddress += `${addr.state}, `;
          if (addr.postcode) detailedAddress += `${addr.postcode}, `;
          if (addr.country) detailedAddress += addr.country;
          
          // Remove trailing comma and space if any
          detailedAddress = detailedAddress.replace(/, $/, '');
          
          return detailedAddress || data.display_name;
        }

        return 'Location details unavailable';
      } catch (error) {
        console.error(`Reverse geocoding attempt ${attempt} failed:`, error.message);
        if (attempt === retries) {
          return 'Could not retrieve location details';
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const getLocation = async () => {
    setIsLoadingLocation(true);

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is required to verify your work location');
      setIsLoadingLocation(false);
      return;
    }

    try {
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High // Use high accuracy for precise location
      });

      const locationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      };

      setLocation(locationData);

      const name = await getDetailedLocationName(locationData.latitude, locationData.longitude);
      setLocationName(name);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Could not get your current location. Please try again.');
      setLocationName('Location details unavailable');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setLocationName('');
  };

  const handleSubmit = async () => {
    // Validate all fields
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    
    if (!phone.trim()) {
      Alert.alert('Required Field', 'Please enter your phone number.');
      return;
    }
    
    if (!address.trim()) {
      Alert.alert('Required Field', 'Please enter your address.');
      return;
    }
    
    if (!skills.trim()) {
      Alert.alert('Required Field', 'Please enter your skills/expertise.');
      return;
    }
    
    if (!experience.trim()) {
      Alert.alert('Required Field', 'Please enter your years of experience.');
      return;
    }
    
    if (!service.trim()) {
      Alert.alert('Required Field', 'Please enter the service you want to provide.');
      return;
    }
    
    if (!location) {
      Alert.alert('Required Field', 'Please set your work location.');
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
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        skills: skills.trim(),
        experience: experience.trim(),
        service: service.trim(),
        lat: location.latitude,
        lng: location.longitude,
        locationName: locationName, // Send resolved location name
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
      Alert.alert('Success', 'Application submitted successfully!');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not submit application. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Worker Application</Text>
        <Text style={styles.subtitle}>Fill in all required details to apply as a service provider</Text>

        <TextInput 
          placeholder="Full Name *" 
          style={styles.input} 
          value={fullName} 
          onChangeText={setFullName} 
        />
        
        <TextInput 
          placeholder="Phone Number *" 
          keyboardType="phone-pad" 
          style={styles.input} 
          value={phone} 
          onChangeText={setPhone} 
        />
        
        <TextInput 
          placeholder="Complete Address *" 
          style={[styles.input, styles.textArea]} 
          multiline 
          value={address} 
          onChangeText={setAddress} 
        />
        
        <TextInput 
          placeholder="Skills / Expertise *" 
          style={styles.input} 
          value={skills} 
          onChangeText={setSkills} 
        />
        
        <TextInput 
          placeholder="Years of Experience *" 
          style={styles.input} 
          keyboardType="numeric" 
          value={experience} 
          onChangeText={setExperience} 
        />
        
        <TextInput 
          placeholder="Service you want to provide * (e.g., Electrician, Plumber)" 
          style={styles.input} 
          value={service} 
          onChangeText={setService} 
        />

        <View style={styles.locationSection}>
          <Text style={styles.sectionLabel}>Verify Your Work Location *</Text>
          
          {location ? (
            <View style={styles.locationSetContainer}>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={20} color="#27ae60" />
                <Text style={styles.locationText} numberOfLines={3}>
                  {locationName || 'Getting location details...'}
                </Text>
              </View>
              <TouchableOpacity onPress={clearLocation} style={styles.changeLocationBtn}>
                <Text style={styles.changeLocationText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.locationBtn} 
              onPress={getLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="navigate" size={18} color="#fff" />
                  <Text style={styles.btnText}>Verify Current Location</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          <Text style={styles.locationHelp}>
            IMPORTANT: Please physically go to the address where you want to provide services, 
            then use this button to verify your exact location. This ensures customers can find 
            you for local services in your preferred work area.
          </Text>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.btnText}>Submit Application</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  container: { 
    padding: 20, 
    paddingBottom: 40 
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 6,
    color: '#2c3e50'
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20
  },
  input: {
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8,
    padding: 14, 
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  locationSection: {
    marginBottom: 20,
    marginTop: 8
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2c3e50'
  },
  locationBtn: {
    backgroundColor: '#3498db', 
    padding: 14,
    borderRadius: 8, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  locationSetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 10
  },
  locationText: {
    marginLeft: 8,
    color: '#2c3e50',
    flex: 1,
    fontSize: 14,
    lineHeight: 18
  },
  changeLocationBtn: {
    padding: 6,
    borderRadius: 4
  },
  changeLocationText: {
    color: '#3498db',
    fontWeight: '500'
  },
  locationHelp: {
    fontSize: 12,
    color: '#e74c3c',
    fontStyle: 'italic',
    lineHeight: 16,
    backgroundColor: '#ffeaa7',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#fdcb6e'
  },
  submitBtn: {
    backgroundColor: '#27ae60', 
    padding: 16,
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 12,
  },
  btnText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16
  },
});

export default WorkerApplicationScreen;