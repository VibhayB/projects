import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, ScrollView, Alert, TextInput, RefreshControl,
  Linking, Platform, Modal, Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import config from '../utils/config';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

function ServiceScreen({ route, navigation }) {
  const { booking: initialBooking, providerId } = route.params;
  const [status, setStatus] = useState(initialBooking?.state || '');
  const [details, setDetails] = useState(initialBooking || null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [enteredUserOtp, setEnteredUserOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [otherReason, setOtherReason] = useState('');
  const [cancelAction, setCancelAction] = useState(''); 

  const reasonOptions = [
    'Customer not responding',
    'Location issues',
    'Emergency situation',
    'Equipment problems',
    'Schedule conflict',
    'Found better opportunity',
    'Others',
  ];

  const fetchLatest = useCallback(async () => {
    if (!initialBooking?.id) return;

    try {
      setRefreshing(true);
      const res = await fetch(`${config.BASE_URL}/booking/${initialBooking.id}`);
      if (res.ok) {
        const fresh = await res.json();
        setDetails(fresh);
        setStatus(fresh.state);
      } else {
        console.warn('Failed to fetch booking details');
      }
    } catch (e) {
      console.warn('Could not refresh booking', e);
      Alert.alert('Error', 'Failed to refresh booking details');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [initialBooking?.id]);

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for navigation');
        return null;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      };

      setCurrentLocation(coords);
      return coords;
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Unable to get your current location');
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    if (initialBooking?.id) {
      fetchLatest();
    }
    getCurrentLocation();
  }, [fetchLatest]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (initialBooking?.id) {
        fetchLatest();
      }
      getCurrentLocation();
    }, [fetchLatest])
  );

  const handleCancelWithReasons = async () => {
    const allReasons = [...selectedReasons];
    if (otherReason.trim()) {
      allReasons.push(otherReason.trim());
    }

    try {
      let newState, endpoint;
      
      if (cancelAction === 'reject') {
        newState = 'booking cancelled';
        endpoint = 'cancel';
      } else {
        newState = 'booking cancelled';
        endpoint = 'cancel';
      }

      const res = await fetch(`${config.BASE_URL}/requests/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          providerId, 
          bookingId: initialBooking.id,
          reasons: allReasons
        })
      });

      const result = await res.json();
      
      if (res.ok) {
        setStatus(newState);
        const actionText = cancelAction === 'reject' ? 'rejected' : 'cancelled';
        Alert.alert('Success', `Booking ${actionText} successfully.`);
        setShowCancelModal(false);
        setSelectedReasons([]);
        setOtherReason('');
        setCancelAction('');
        await fetchLatest();
        navigation.goBack();
      } else {
        Alert.alert('Error', result.message || 'Action failed, try again.');
      }
    } catch (error) {
      console.error('Error with booking action:', error);
      Alert.alert('Error', 'Action failed, try again.');
    }
  };

  const showCancelModalWithAction = (action) => {
    setCancelAction(action);
    setShowCancelModal(true);
  };

  const updateStatus = async (newState, endpoint) => {
    try {
      const res = await fetch(`${config.BASE_URL}/requests/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, bookingId: initialBooking.id })
      });
      if (!res.ok) throw new Error();
      setStatus(newState);
      Alert.alert('Success', `Booking ${newState}.`);
      await fetchLatest();
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
        body: JSON.stringify({ bookingId: initialBooking.id, otp: enteredUserOtp })
      });
      const out = await res.json();
      if (res.ok && out.success) {
        setStatus('double confirmed');
        setEnteredUserOtp('');
        Alert.alert('Success', 'Customer OTP verified – job double-confirmed!');
        await fetchLatest();
      } else {
        Alert.alert('Error', out.message || 'Incorrect OTP');
      }
    } catch {
      Alert.alert('Error', 'Server error verifying OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const openExternalNavigation = async () => {
    if (!details?.location || !details.location.lat || !details.location.lng) {
      Alert.alert('Error', 'Customer location not available');
      return;
    }

    const coords = await getCurrentLocation();
    if (!coords) return;

    const { lat, lng } = details.location;

    const url = Platform.select({
      ios: `maps://?saddr=${coords.lat},${coords.lng}&daddr=${lat},${lng}&dirflg=d`,
      android: `google.navigation:q=${lat},${lng}`
    });

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${lat},${lng}&travelmode=driving`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening navigation:', error);
      Alert.alert('Error', 'Could not open navigation app');
    }
  };

  const openEmbeddedMap = () => {
    if (!details?.location) {
      Alert.alert('Error', 'Customer location not available');
      return;
    }
    setMapModalVisible(true);
  };

  const generateMapHtml = () => {
    if (!details?.location || !currentLocation) return '';

    const { lat, lng } = details.location;
    const locationName = details.location.name || 'Customer Location';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .navigation-info {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      padding: 15px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .navigation-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #333;
    }
    .navigation-instruction {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    .navigation-distance {
      font-size: 18px;
      font-weight: bold;
      color: #007AFF;
      margin-top: 5px;
    }
    .location-name {
      font-size: 14px;
      color: #555;
      margin-top: 5px;
      font-style: italic;
    }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</head>
<body>
  <div id="map"></div>
  <div class="navigation-info">
    <div class="navigation-title">Navigation to Customer</div>
    <div class="navigation-instruction" id="instruction">Calculating route...</div>
    <div class="navigation-distance" id="distance">--</div>
    <div class="location-name" id="locationName">${locationName}</div>
  </div>
  
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
  <script>
    const map = L.map('map').setView([${currentLocation.lat}, ${currentLocation.lng}], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const currentIcon = L.divIcon({
      className: 'current-location-marker',
      html: '<div style="background-color: #007AFF; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    
    L.marker([${currentLocation.lat}, ${currentLocation.lng}], {icon: currentIcon})
     .addTo(map)
     .bindPopup('Your Current Location');

    const customerIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    L.marker([${lat}, ${lng}], {icon: customerIcon})
     .addTo(map)
     .bindPopup('${locationName.replace(/'/g, "\\'")}');

    const control = L.Routing.control({
      waypoints: [
        L.latLng(${currentLocation.lat}, ${currentLocation.lng}),
        L.latLng(${lat}, ${lng})
      ],
      routeWhileDragging: false,
      lineOptions: {
        styles: [{color: '#007AFF', opacity: 0.8, weight: 6}]
      },
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      createMarker: function(i, waypoint, n) {
        return null;
      }
    }).addTo(map);

    control.on('routesfound', function(e) {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const route = routes[0];
        const instruction = route.instructions && route.instructions.length > 0 
          ? route.instructions[0].text 
          : 'Follow the route';
        const distance = (route.summary.totalDistance / 1000).toFixed(1) + ' km';
        
        document.getElementById('instruction').textContent = instruction;
        document.getElementById('distance').textContent = distance;
      }
    });

    const container = control.getContainer();
    if (container) {
      container.style.display = 'none';
    }
  </script>
</body>
</html>`;
  };

  const canCancelBooking = () => {
    const blockedStates = ['request sent', 'double confirmed', 'completed', 'booking cancelled'];
    return !blockedStates.includes(status);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading booking details...</Text>
      </View>
    );
  }

  // No booking data
  if (!details) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Booking not found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.actionButton, { backgroundColor: '#007AFF', marginTop: 20 }]}
        >
          <Text style={styles.actionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allowedStatuses = ['request sent', 'approved', 'confirmed', 'double confirmed'];
  const convertTimeToAmPm = (timeString) => {
    const [hourStr, minuteStr] = timeString.split(':');
    
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return 'Invalid time';
    }
    
    const period = hour >= 12 ? 'PM' : 'AM';
    
    let twelveHour = hour % 12;
    twelveHour = twelveHour === 0 ? 12 : twelveHour; 
    
    const formattedMinute = minute.toString().padStart(2, '0');
    
    return `${twelveHour}:${formattedMinute} ${period}`;
  };
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthName = monthNames[month - 1]; // month is 1-indexed in the string
    const dayWithSuffix = getDayWithSuffix(day);
    
    return `${monthName} ${dayWithSuffix}, ${year}`;
  };

  const getDayWithSuffix = (day) => {
    if (day >= 11 && day <= 13) {
      return `${day}th`;
    }
    
    switch (day % 10) {
      case 1: return `${day}st`;
      case 2: return `${day}nd`;
      case 3: return `${day}rd`;
      default: return `${day}th`;
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

          <Text style={styles.label}><Text style={styles.bold}>Customer:</Text> {details.username}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Service:</Text> {details.service}</Text>

          <Text style={styles.label}><Text style={styles.bold}>Date:</Text> {formatDate(details.date)}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Time:</Text> {convertTimeToAmPm(details.arrivalTime)}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Duration:</Text> {details.duration} hour(s)</Text>

          {(status !== 'completed') && (
            <Text style={styles.label}><Text style={styles.bold}>Location:</Text> {details.location.name || 'Unknown'}</Text>
          )}
          <Text style={styles.label}><Text style={styles.bold}>Payment:</Text> {details.payment}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Amount:</Text> ₹{details.cost || "To be determined"}</Text>

          <Text style={styles.label}><Text style={styles.bold}>Status:</Text> {status}</Text>

          {details.otpProvider && (
            <Text style={styles.label}>
              <Text style={styles.bold}>Your OTP for Customer:</Text> {details.otpProvider}
            </Text>
          )}
        </View>

        {/* Chat Button */}
        {status !== 'request sent' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8e44ad' }]}
            onPress={() =>
              navigation.navigate('BookingChat', {
                bookingId: initialBooking.id,
                sender: 'provider',
                state: status === 'completed',
                Username: initialBooking.username || 'User'
              })
            }
          >
            <Ionicons name="chatbubble" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Chat with Customer</Text>
          </TouchableOpacity>
        )}

        {status === 'request sent' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#27ae60' }]}
              onPress={() => updateStatus('approved', 'approve')}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
              onPress={() => showCancelModalWithAction('reject')}
            >
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'confirmed' && (
          <View style={styles.otpSection}>
            <Text style={styles.label}>Enter Customer's OTP:</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit OTP"
              keyboardType="numeric"
              maxLength={6}
              value={enteredUserOtp}
              onChangeText={setEnteredUserOtp}
            />
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}
              onPress={verifyUserOtp}
              disabled={otpLoading}
            >
              <Ionicons name="key" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {otpLoading ? 'Verifying…' : 'Verify OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Location Display */}
        {allowedStatuses.includes(status) && details.location && (
          <View style={styles.locationSection}>
            <Text style={[styles.label, styles.bold]}>Service Location:</Text>
            <Text style={styles.locationText}>
              {details.location.name || 'Location details unavailable'}
            </Text>
            
            <View style={styles.locationButtons}>
              <TouchableOpacity
                style={[styles.mapButton, styles.embeddedButton]}
                onPress={openEmbeddedMap}
              >
                <Ionicons name="map" size={20} color="#fff" />
                <Text style={styles.mapButtonText}>View in App</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.mapButton, styles.externalButton]}
                onPress={openExternalNavigation}
                disabled={locationLoading}
              >
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.mapButtonText}>
                  {locationLoading ? 'Loading...' : 'Open Navigation'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Cancel Button - show for most statuses except blocked ones */}
        {canCancelBooking() && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#e74c3c', marginTop: 16 }]}
            onPress={() => showCancelModalWithAction('cancel')}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

        {/* Embedded Map Modal */}
        <Modal
          visible={mapModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setMapModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Navigation to Customer</Text>
              <TouchableOpacity 
                onPress={() => setMapModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalMap}>
              {details?.location && currentLocation && (
                <WebView
                  originWhitelist={['*']}
                  source={{ html: generateMapHtml() }}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Cancel/Reject Modal */}
        {showCancelModal && (
          <Modal
            visible={showCancelModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowCancelModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.cancelModalBox}>
                <Text style={styles.cancelModalTitle}>
                  {cancelAction === 'reject' ? 'Reject Booking' : 'Cancel Booking'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Please select reason(s) for {cancelAction === 'reject' ? 'rejection' : 'cancellation'}:
                </Text>
                
                <ScrollView style={styles.reasonsList}>
                  {reasonOptions.slice(0, -1).map((reason, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.reasonItem}
                      onPress={() =>
                        setSelectedReasons(prev =>
                          prev.includes(reason)
                            ? prev.filter(r => r !== reason)
                            : [...prev, reason]
                        )
                      }
                    >
                      <Text style={styles.reasonText}>
                        {selectedReasons.includes(reason) ? '☑️' : '☐'} {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TextInput
                  style={styles.otherReasonInput}
                  placeholder="Other reason (optional)"
                  value={otherReason}
                  onChangeText={setOtherReason}
                  multiline
                  maxLength={200}
                />

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowCancelModal(false);
                      setSelectedReasons([]);
                      setOtherReason('');
                      setCancelAction('');
                    }}
                    style={[styles.modalButton, styles.cancelButton]}
                  >
                    <Text style={styles.cancelButtonText}>Back</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleCancelWithReasons}
                    style={[styles.modalButton, styles.confirmButton]}
                    disabled={selectedReasons.length === 0 && !otherReason.trim()}
                  >
                    <Text style={styles.confirmButtonText}>
                      {cancelAction === 'reject' ? 'Confirm Reject' : 'Confirm Cancel'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  aboutTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  bookingCard: { 
    backgroundColor: '#f9f9f9', 
    padding: 20, 
    borderRadius: 12, 
    width: '90%', 
    marginTop: 20 
  },
  label: { fontSize: 16, marginVertical: 4, color: '#333' },
  bold: { fontWeight: 'bold' },
  locationSection: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b3e0ff',
    width: '90%',
    marginHorizontal: '5%'
  },
  locationText: {
    fontSize: 14,
    color: '#1976d2',
    marginVertical: 5
  },
  locationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44
  },
  embeddedButton: {
    backgroundColor: '#007AFF'
  },
  externalButton: {
    backgroundColor: '#34C759'
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    marginTop: 16,
    justifyContent: 'center'
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 6, 
    padding: 12, 
    marginTop: 6,
    fontSize: 16,
    width: '100%'
  },
  otpSection: {
    width: '90%',
    marginTop: 20,
    alignItems: 'center'
  },
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
  },
  // Cancel modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  reasonsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  reasonItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
  },
  otherReasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#e74c3c',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ServiceScreen;