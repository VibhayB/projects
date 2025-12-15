import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions, Alert, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import config from '../utils/config';
import { useLocation } from '../contexts/LocationContext';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function ProvidersScreen({ route, navigation }) {
  const { serviceId, title } = route.params;
  const {
    gpsCoords,
    userSelectedLocation,
    locationName,
    locationLoading,
    isResolvingLocationName,
    getCurrentLocation,
    updateUserSelectedLocation
  } = useLocation();

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [tempCoords, setTempCoords] = useState(null);
  const [tempLocationName, setTempLocationName] = useState(null);
  const [isResolvingTempName, setIsResolvingTempName] = useState(false);
  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);
  const [screenLocationName, setScreenLocationName] = useState(locationName || '');
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [mapState, setMapState] = useState(() => {
    const currentLocation = userSelectedLocation || gpsCoords;
    return currentLocation
      ? { lat: currentLocation.lat, lng: currentLocation.lng, zoom: 14 }
      : { lat: 20.59, lng: 78.96, zoom: 5 };
  });
  const mapRef = useRef();

  const getLocationName = async (latitude, longitude) => {
    setIsResolvingTempName(true);
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
      setIsResolvingTempName(false);
    }
  };

  // Initialize screen with proper location handling
  useEffect(() => {
    const initializeScreen = async () => {
      setIsInitializing(true);
      
      try {
        let targetLocation = null;
        let targetLocationName = '';

        if (userSelectedLocation) {
          targetLocation = userSelectedLocation;
          
          if (locationName) {
            targetLocationName = locationName;
            setScreenLocationName(locationName);
          } else {
            const resolvedName = await getLocationName(userSelectedLocation.lat, userSelectedLocation.lng);
            targetLocationName = resolvedName;
            setScreenLocationName(resolvedName);
            await updateUserSelectedLocation(userSelectedLocation, resolvedName);
          }
        }
        else if (gpsCoords) {
          targetLocation = gpsCoords;
          const resolvedName = await getLocationName(gpsCoords.lat, gpsCoords.lng);
          targetLocationName = resolvedName;
          setScreenLocationName(resolvedName);
          await updateUserSelectedLocation(gpsCoords, resolvedName);
        }
        else {
          const coords = await getCurrentLocation();
          if (coords) {
            targetLocation = coords;
            const resolvedName = await getLocationName(coords.lat, coords.lng);
            targetLocationName = resolvedName;
            setScreenLocationName(resolvedName);
            await updateUserSelectedLocation(coords, resolvedName);
          }
        }

        // Fetch providers if we have a location
        if (targetLocation) {
          await fetchProviders(targetLocation.lat, targetLocation.lng);
        }
        
      } catch (error) {
        console.error('Error initializing screen:', error);
        Alert.alert('Error', 'Failed to initialize location');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeScreen();
  }, []); // Only run once on mount

  useEffect(() => {
    if (locationName && locationName !== screenLocationName) {
      setScreenLocationName(locationName);
    }
  }, [locationName]);

  useEffect(() => {
    if (userSelectedLocation && !isInitializing) {
      fetchProviders(userSelectedLocation.lat, userSelectedLocation.lng);
    }
  }, [userSelectedLocation]);

  useEffect(() => {
    if (tempCoords) {
      getLocationName(tempCoords.lat, tempCoords.lng).then(name => {
        setTempLocationName(name);
      });
    } else {
      setTempLocationName(null);
    }
  }, [tempCoords]);

  const fetchProviders = async (lat, lng) => {
    setLoading(true);
    console.log('Fetching providers for:', { lat, lng });
    try {
      const url = `${config.BASE_URL}/providers/${serviceId}?lat=${lat}&lng=${lng}`;
      const res = await fetch(url);
      const data = await res.json();
      setProviders(data);
    } catch (e) {
      console.error('Error:', e);
      Alert.alert('Error', 'Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  const onMapTap = (msg) => {
    try {
      const data = msg.nativeEvent.data;
      if (data.startsWith('mapstate:')) {
        const state = data.replace('mapstate:', '');
        const [lat, lng, zoom] = state.split(',');
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lng);
        const newZoom = parseFloat(zoom);
        if (!tempCoords || Math.abs(tempCoords.lat - newLat) > 0.0001 || Math.abs(tempCoords.lng - newLng) > 0.0001) {
          setTempCoords({ lat: newLat, lng: newLng });
        }
        setMapState({ lat: newLat, lng: newLng, zoom: newZoom });
      } else if (data.startsWith('location_error:')) {
        const error = data.replace('location_error:', '');
        Alert.alert('Location Error', error);
      }
    } catch (e) {
      console.log('Invalid message:', e);
    }
  };

  const confirmLocation = async () => {
    if (!tempCoords) return;
    
    setIsConfirmingLocation(true);
    try {
      let finalLocationName = tempLocationName;
      if (isResolvingTempName || !tempLocationName) {
        finalLocationName = await getLocationName(tempCoords.lat, tempCoords.lng);
      }
      
      await updateUserSelectedLocation(tempCoords, finalLocationName);
      
      setScreenLocationName(finalLocationName);
      
      setMapModalVisible(false);
      
      await fetchProviders(tempCoords.lat, tempCoords.lng);
      
    } catch (error) {
      console.error('Error confirming location:', error);
      Alert.alert('Error', 'Failed to confirm location');
    } finally {
      setIsConfirmingLocation(false);
    }
  };

  const openMapModal = async () => {
    setMapModalVisible(true);
    const currentLocation = userSelectedLocation || gpsCoords;
    if (currentLocation) {
      setTempCoords(currentLocation);
      setMapState({ lat: currentLocation.lat, lng: currentLocation.lng, zoom: 14 });
      setTempLocationName(screenLocationName || locationName);
      setTimeout(() => {
        if (mapRef.current && gpsCoords) {
          mapRef.current.injectJavaScript(`
            map.panTo([${currentLocation.lat}, ${currentLocation.lng}], { animate: true, duration: 0.3 });
            window.updateCurrentLocation(${gpsCoords.lat}, ${gpsCoords.lng});
            true;
          `);
        }
      }, 300);
      return;
    }

    const coords = await getCurrentLocation();
    if (coords) {
      setTempCoords(coords);
      setMapState({ lat: coords.lat, lng: coords.lng, zoom: 14 });
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.injectJavaScript(`
            map.panTo([${coords.lat}, ${coords.lng}], { animate: true, duration: 0.3 });
            window.updateCurrentLocation(${coords.lat}, ${coords.lng});
            true;
          `);
        }
      }, 300);
    }
  };

  const closeMapModal = () => {
    setMapModalVisible(false);
    setTempLocationName(null);
    setTempCoords(null);
  };

  const generateHtml = useMemo(() => {
    const initialLocation = userSelectedLocation || gpsCoords || { lat: 20.59, lng: 78.96 };
    const initialZoom = userSelectedLocation || gpsCoords ? 14 : 5;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .center-pin {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      z-index: 1000;
      font-size: 28px;
      color: #ff4444;
      text-shadow: 0 2px 4px rgba(0,0,0,0.4);
      pointer-events: none;
    }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</head>
<body>
  <div id="map"></div>
  <div class="center-pin">📍</div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    let map;
    let currentLocationLayer;
    let hasUserInteracted = false;
    
    function initMap() {
      map = L.map('map', {
        preferCanvas: true,
        zoomAnimation: false,
        fadeAnimation: false
      }).setView([${initialLocation.lat}, ${initialLocation.lng}], ${initialZoom});
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      currentLocationLayer = L.layerGroup().addTo(map);

      const blueIcon = L.divIcon({
        className: 'current-location-marker',
        html: '<div style="background-color: #007AFF; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      window.updateCurrentLocation = function(lat, lng) {
        currentLocationLayer.clearLayers();
        currentLocationLayer.addLayer(L.marker([lat, lng], {icon: blueIcon}).bindPopup('Your GPS Location'));
      };

      ${gpsCoords ? `window.updateCurrentLocation(${gpsCoords.lat}, ${gpsCoords.lng});` : ''}

      function debounce(fn) {
        let timeout;
        return function() {
          cancelAnimationFrame(timeout);
          timeout = requestAnimationFrame(() => fn.apply(null, arguments));
        };
      }

      map.on('moveend', debounce(() => {
        if (hasUserInteracted) {
          const center = map.getCenter();
          const zoom = map.getZoom();
          window.ReactNativeWebView.postMessage('mapstate:' + center.lat + ',' + center.lng + ',' + zoom);
        }
      }));

      map.on('dragstart', () => { 
        hasUserInteracted = true;
      });

      map.on('click', (e) => {
        hasUserInteracted = true;
        map.panTo([e.latlng.lat, e.latlng.lng], { animate: true, duration: 0.3 });
        window.ReactNativeWebView.postMessage('mapstate:' + e.latlng.lat + ',' + e.latlng.lng + ',' + map.getZoom());
      });
    }

    initMap();
  </script>
</body>
</html>`;
  }, [userSelectedLocation, gpsCoords]);

  const ProviderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (!userSelectedLocation) {
          Alert.alert('Location Required', 'Please select a location first');
          return;
        }
        navigation.navigate('ProviderDetail', { provider: item });
      }}
    >
      <Image source={{ uri: item.image || 'https://icons.veryicon.com/png/o/miscellaneous/administration/account-25.png' }} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.rating}>⭐ {item.rating} ({item.totalRating})</Text>
        <Text style={styles.jobs}>Jobs: {item.successfulServices}</Text>
      </View>
    </TouchableOpacity>
  );

  // Show loading while initializing
  if (isInitializing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.heading}>Loading...</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Setting up your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.heading}>{title} Providers</Text>
        <TouchableOpacity style={styles.changeLocationButton} onPress={openMapModal}>
          <Text style={styles.changeLocationText}>Change Location</Text>
        </TouchableOpacity>
      </View>

      {/* Location Display Section */}
      {screenLocationName && (
        <View style={styles.locationSection}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.locationText}>{screenLocationName}</Text>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={item => item.id}
          renderItem={ProviderCard}
          style={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {providers.length > 0
                  ? `${providers.length} providers found`
                  : userSelectedLocation
                    ? 'No providers found in this area. Try a different location.'
                    : 'Getting your location...'}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={mapModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeMapModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={closeMapModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalMap}>
            <WebView
              ref={mapRef}
              originWhitelist={['*']}
              source={{ html: generateHtml }}
              onMessage={onMapTap}
              style={{ flex: 1 }}
              onLoadEnd={() => {
                if (mapRef.current && gpsCoords) {
                  mapRef.current.injectJavaScript(`
                    if (map) {
                      map.panTo([${mapState.lat}, ${mapState.lng}], { animate: true, duration: 0.3 });
                      window.updateCurrentLocation(${gpsCoords.lat}, ${gpsCoords.lng});
                    }
                    true;
                  `);
                }
              }}
            />
            <View style={styles.mapOverlay}>
              <Text style={styles.overlayText} numberOfLines={2}>
                {isResolvingTempName || isConfirmingLocation
                  ? 'Loading location...'
                  : tempLocationName
                    ? `${tempLocationName}`
                    : 'Move map to select service location'}
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.overlayButton, styles.confirmButton]} 
                  onPress={confirmLocation}
                  disabled={isConfirmingLocation || isResolvingTempName || !tempCoords}
                >
                  {isConfirmingLocation ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm Location</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.overlayButton, styles.myLocationButton]}
                  onPress={async () => {
                    try {
                      const coords = await getCurrentLocation();
                      if (coords) {
                        setTempCoords(coords);
                        setMapState({ lat: coords.lat, lng: coords.lng, zoom: 14 });
                        if (mapRef.current) {
                          mapRef.current.injectJavaScript(`
                            map.panTo([${coords.lat}, ${coords.lng}], { animate: true, duration: 0.3 });
                            window.updateCurrentLocation(${coords.lat}, ${coords.lng});
                            true;
                          `);
                        }
                      }
                    } catch (error) {
                      console.error('Error getting location:', error);
                    }
                  }}
                  disabled={locationLoading || isConfirmingLocation}
                >
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: -2 }}>
                    {locationLoading ? (
                      <ActivityIndicator size="small" color="#6e6e6eff" />
                    ) : (
                      <Ionicons name="locate" size={24} color="#000000ff" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  changeLocationButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeLocationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  locationSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loader: {
    margin: 20,
  },
  list: {
    flex: 1,
    paddingHorizontal: 12,
  },
  listHeader: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  listHeaderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  card: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  image: { width: 60, height: 60, borderRadius: 30, marginRight: 10 },
  name: { fontSize: 16, fontWeight: '600' },
  rating: { fontSize: 14, color: '#f39c12', marginTop: 2 },
  jobs: { fontSize: 14, color: '#666', marginTop: 1 },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  modalMap: {
    flex: 1,
    position: 'relative',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  overlayText: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
    maxWidth: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlayButton: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#fff',
    flex: 1,
    marginRight: 10,
    minHeight: 50,
  },
  confirmButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  myLocationButton: {
    backgroundColor: '#fff',
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});