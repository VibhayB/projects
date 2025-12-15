// contexts/LocationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [gpsCoords, setGpsCoords] = useState(null);
  const [userSelectedLocation, setUserSelectedLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return null;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const { latitude, longitude } = location.coords;
      const newCoords = { lat: latitude, lng: longitude };
      
      setGpsCoords(newCoords);
      
      // Set as user selected location if none exists
      if (!userSelectedLocation) {
        setUserSelectedLocation(newCoords);
      }
      
      return newCoords;
      
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get your current location');
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const updateUserSelectedLocation = (location) => {
    setUserSelectedLocation(location);
  };

  const value = {
    gpsCoords,
    userSelectedLocation,
    locationLoading,
    getCurrentLocation,
    updateUserSelectedLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};