import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import config from '../utils/config';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useLocation } from '../contexts/LocationContext';
import BookingModal from '../components/BookingModal';

const ProviderDetailScreen = ({ route, navigation }) => {
  const { provider } = route.params || {};
  const { userSelectedLocation, locationName, getCurrentLocation } = useLocation();

  const [hasActiveBookings, setHasActiveBookings] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [isLocationValid, setIsLocationValid] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isProviderAvailable, setIsProviderAvailable] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [locationDisplayName, setLocationDisplayName] = useState('Resolving...');
  const [isResolvingLocationName, setIsResolvingLocationName] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const getLocationName = async (latitude, longitude) => {
    setIsResolvingLocationName(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WorkerApp/1.0 (contact@workerapp.com)',
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      return data.display_name || 'Unknown location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Unknown location';
    } finally {
      setIsResolvingLocationName(false);
    }
  };

  useEffect(() => {
    if (!provider) {
      Alert.alert('Error', 'Provider information is missing', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }

    const checkLocationAndAvailability = async () => {
      setLocationLoading(true);
      let validLocation = userSelectedLocation;
      let displayName = locationName; // Use existing location name from context

      if (!validLocation) {
        const coords = await getCurrentLocation();
        if (coords) {
          validLocation = coords;
          displayName = null;
        }
      }

      const locationValid = validLocation && validLocation.lat !== undefined && validLocation.lng !== undefined;
      setIsLocationValid(locationValid);

      if (locationValid) {
        if (displayName) {
          setLocationDisplayName(displayName);
        } else {
          const name = await getLocationName(validLocation.lat, validLocation.lng);
          setLocationDisplayName(name);
        }

        setAvailabilityLoading(true);
        try {
          const url = `${config.BASE_URL}/providers/${provider.serviceId}?lat=${validLocation.lat}&lng=${validLocation.lng}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('Failed to fetch providers');
          const providers = await res.json();
          const isAvailable = providers.some(p => p.id === provider.id);
          setIsProviderAvailable(isAvailable);
        } catch (e) {
          console.error('Error checking provider availability:', e);
          setIsProviderAvailable(false);
        } finally {
          setAvailabilityLoading(false);
        }
      }

      setLocationLoading(false);
      setIsReady(true);
    };

    checkLocationAndAvailability();
  }, [provider, userSelectedLocation, locationName]); 

  useEffect(() => {
    if (locationName && isLocationValid && locationName !== locationDisplayName) {
      setLocationDisplayName(locationName);
    }
  }, [locationName, isLocationValid]);

  useEffect(() => {
    const loadSession = async () => {
      const id = await AsyncStorage.getItem('sessionId');
      setSessionId(id);
    };
    loadSession();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!provider || !sessionId) return;

      const checkBookings = async () => {
        try {
          const response = await fetch(`${config.BASE_URL}/bookings/${sessionId}`);
          const data = await response.json();
          const providerBookings = data.filter(b => b.providerId === provider.id);
          setUserBookings(providerBookings);
          const active = providerBookings.some(b => 
            !['cancelled', 'completed'].includes(b.state)
          );
          setHasActiveBookings(active);
        } catch (e) {
          console.error('Error checking bookings:', e);
        }
      };

      checkBookings();
    }, [sessionId, provider])
  );

  const handleViewBookings = () => {
    navigation.navigate('ProviderBookings', { 
      provider, 
      bookings: userBookings 
    });
  };

  const handleViewRatings = () => {
    navigation.navigate('ProviderRatings', {
      providerName: provider.name,
      comments: provider.comments || []
    });
  };

  const handleBookingSuccess = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/bookings/${sessionId}`);
      const data = await response.json();
      const providerBookings = data.filter(b => b.providerId === provider.id);
      setUserBookings(providerBookings);
      setHasActiveBookings(true);
    } catch (e) {
      console.error('Error updating bookings:', e);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    const coords = await getCurrentLocation();
    if (coords) {
      setIsLocationValid(true);
      
      let displayName = null;
      
      if (userSelectedLocation && 
          Math.abs(userSelectedLocation.lat - coords.lat) < 0.0001 && 
          Math.abs(userSelectedLocation.lng - coords.lng) < 0.0001 && 
          locationName) {
        displayName = locationName;
        setLocationDisplayName(displayName);
      } else {
        // Otherwise resolve the name
        setIsResolvingLocationName(true);
        displayName = await getLocationName(coords.lat, coords.lng);
        setLocationDisplayName(displayName);
      }
      
      setAvailabilityLoading(true);
      try {
        const url = `${config.BASE_URL}/providers/${provider.serviceId}?lat=${coords.lat}&lng=${coords.lng}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch providers');
        const providers = await res.json();
        setIsProviderAvailable(providers.some(p => p.id === provider.id));
      } catch (e) {
        console.error('Error checking provider availability:', e);
        setIsProviderAvailable(false);
      } finally {
        setAvailabilityLoading(false);
        setIsResolvingLocationName(false);
      }
    }
    setLocationLoading(false);
  };

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading provider details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Provider details not found.
          </Text>
          <TouchableOpacity
            style={[styles.button, { marginTop: 20 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {(locationLoading || availabilityLoading || isResolvingLocationName) ? (
        <View style={styles.locationCard}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={[styles.locationText, { color: '#1976d2' }]}>
            Loading location and availability...
          </Text>
        </View>
      ) : isLocationValid ? (
        <View style={[styles.locationCard, { backgroundColor: isProviderAvailable ? '#e3f2fd' : '#fff3cd' }]}>
          <Text style={[styles.locationText, { color: isProviderAvailable ? '#1976d2' : '#856404' }]}>
            Selected location: {locationDisplayName}
          </Text>
          {!isProviderAvailable && (
            <Text style={[styles.warningText, { color: '#856404' }]}>
              This provider is not available at your selected location.
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.changeLocationButton,
              { backgroundColor: isProviderAvailable ? '#007bff' : '#856404' }
            ]}
            onPress={() => navigation.navigate('Providers', {
              serviceId: provider.serviceId,
              title: provider.service,
            })}
          >
            <Text style={styles.changeLocationText}>Change Location</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.locationCard, { backgroundColor: '#fff3cd' }]}>
          <Text style={[styles.warningText, { color: '#856404' }]}>
            Please select a location to book this service
          </Text>
          <TouchableOpacity
            style={[styles.changeLocationButton, { backgroundColor: '#856404' }]}
            onPress={handleUseCurrentLocation}
          >
            <Text style={styles.changeLocationText}>Use Current Location</Text>
          </TouchableOpacity>
          {provider?.serviceId && (
            <TouchableOpacity
              style={[styles.changeLocationButton, { backgroundColor: '#856404', marginTop: 8 }]}
              onPress={() => navigation.navigate('Providers', {
                serviceId: provider.serviceId,
                title: provider.service,
              })}
            >
              <Text style={styles.changeLocationText}>Choose Location on Map</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <Image source={{ uri: provider.image || 'https://icons.veryicon.com/png/o/miscellaneous/administration/account-25.png' }} style={styles.image} />
      <Text style={styles.name}>{provider.name}</Text>
      <Text style={styles.service}>Service: {capitalize(provider.service)}</Text>
      <Text>⭐ {provider.rating} ({provider.totalRating} ratings)</Text>
      <Text>Successful Services: {provider.successfulServices}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button, 
            { 
              backgroundColor: isLocationValid && isProviderAvailable ? '#007BFF' : '#ccc',
              opacity: isLocationValid && isProviderAvailable ? 1 : 0.6
            }
          ]}
          onPress={() => {
            if (!isLocationValid) {
              Alert.alert('Location Required', 'Please select a valid service location.');
              return;
            }
            if (!isProviderAvailable) {
              Alert.alert(
                'Provider Unavailable',
                'This provider is not available at your selected location.',
                [
                  { text: 'OK' },
                  {
                    text: 'Change Location',
                    onPress: () => navigation.navigate('Providers', {
                      serviceId: provider.serviceId,
                      title: provider.service,
                    })
                  }
                ]
              );
              return;
            }
            setShowBookingModal(true);
          }}
          disabled={!isLocationValid || !isProviderAvailable}
        >
          <Text style={styles.buttonText}>
            Book Now
          </Text>
        </TouchableOpacity>

        {userBookings.length > 0 && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#6c757d' }]}
            onPress={handleViewBookings}
          >
            <Text style={styles.buttonText}>
              View My Bookings ({userBookings.length})
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#17a2b8' }]}
          onPress={handleViewRatings}
        >
          <Text style={styles.buttonText}>
            View Ratings ({provider.comments?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      <BookingModal
        visible={showBookingModal}
        provider={provider}
        sessionId={sessionId}
        userSelectedLocation={userSelectedLocation}
        locationDisplayName={locationDisplayName}
        onClose={() => setShowBookingModal(false)}
        onBookingSuccess={handleBookingSuccess}
      />
    </SafeAreaView>
  );
};

const capitalize = (str = '') =>
  str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    padding: 20,
    justifyContent: 'flex-start'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  locationCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  changeLocationButton: {
    padding: 8,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
  },
  changeLocationText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  image: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    marginBottom: 20 
  },
  name: { 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  service: { 
    fontSize: 16, 
    color: '#444', 
    marginBottom: 4 
  },
  buttonContainer: {
    marginTop: 20,
    width: '80%',
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProviderDetailScreen;