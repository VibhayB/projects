import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import config from '../utils/config';

import { RatingModal, StarRating } from '../components/RatingModal';

const { width, height } = Dimensions.get('window');

// Helper function to capitalize service names
const capitalize = (str = "") => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
};

const BookingScreen = ({ route, navigation }) => {
  const { provider, booking: initialBooking } = route.params || {};
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [otherReason, setOtherReason] = useState("");
  const [bookingDetails, setBookingDetails] = useState(initialBooking || null);
  const [enteredProviderOtp, setEnteredProviderOtp] = useState("");
  const [otpCheckLoading, setOtpCheckLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const reasonOptions = [
    "Found a better provider",
    "Change of plans",
    "Accidental booking",
    "Too expensive",
    "Others",
  ];

  useEffect(() => {
    const loadSession = async () => {
      const id = await AsyncStorage.getItem("sessionId");
      setSessionId(id);
    };
    loadSession();
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchLatestBooking();
    }
  }, [sessionId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (sessionId) {
        fetchLatestBooking();
      }
    });
    return unsubscribe;
  }, [navigation, sessionId]);

  const fetchLatestBooking = async () => {
    if (!sessionId || !provider?.id) return;
    
    setRefreshing(true);
    setLoading(true);
    
    try {
      const res = await fetch(`${config.BASE_URL}/bookings/${sessionId}`);
      const list = await res.json();
      
      const fresh = initialBooking 
        ? list.find(b => b.id === initialBooking.id)
        : list.find(b => b.providerId === provider.id);
      
      if (fresh) {
        setBookingDetails(fresh);
      } else {
        setBookingDetails(initialBooking || null);
      }
    } catch (e) {
      console.warn("Error refreshing booking:", e);
      Alert.alert("Error", "Failed to refresh booking data");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const markBookingAsRated = async (bookingId) => {
    try {
      await fetch(`${config.BASE_URL}/mark-booking-rated`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rated: true }),
      });
    } catch (err) {
      console.warn("Error marking booking as rated:", err);
    }
  };

  const hasQuarterPassed = (b) => {
    if (!b) return false;
    const start = new Date(`${b.date}T${b.arrivalTime}:00`).getTime();
    const now = Date.now();
    const durMin = parseInt(b.duration || "1", 10) * 60;
    const quarter = start + durMin * 0.25 * 60 * 1000;
    return now >= quarter;
  };

  const handleUnbooking = async () => {
    setShowCancelModal(true);
  };

  const handleDonePress = async () => {
    try {
      const res = await fetch(`${config.BASE_URL}/mark-done`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingDetails.id }),
      });
      const out = await res.json();
      if (res.ok && out.success) {
        if (!bookingDetails.rated || bookingDetails.rated === null || bookingDetails.rated === false) {
          setShowRatingModal(true);
        } else {
          Alert.alert("Thank you!", "Service marked as completed.");
          navigation.goBack();
        }
      } else {
        Alert.alert("Error", out.message || "Could not mark done.");
      }
    } catch (err) {
      console.error("Done error:", err);
      Alert.alert("Error", "Server problem.");
    }
  };

  if (!provider || !sessionId) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "red" }}>Loading...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Loading booking details...</Text>
      </View>
    );
  }

  if (!bookingDetails) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Booking not found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.submitBtn, { marginTop: 20, backgroundColor: "#3498db" }]}
        >
          <Text style={styles.okText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
    
    const monthName = monthNames[month - 1]; 
    const dayWithSuffix = getDayWithSuffix(day);
    
    return `${monthName} ${dayWithSuffix}, ${year}`;
  };

  // Helper function to add ordinal suffix to day
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
        contentContainerStyle={{ alignItems: "center", paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchLatestBooking} />
        }
      >
        <View style={styles.bookingCard}>
          <Text style={styles.aboutTitle}>Booking Details</Text>

          <View style={{ alignItems: "center", width: "100%" }}>
            <Image source={{ uri: provider.image || "https://icons.veryicon.com/png/o/miscellaneous/administration/account-25.png" }} style={styles.image} />
          </View>

          <Text style={styles.label}><Text style={styles.bold}>Provider:</Text> {provider.name}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Service:</Text> {capitalize(provider.service)}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Rating:</Text> ⭐ {provider.rating} ({provider.totalRating} ratings)</Text>
          <Text style={styles.label}><Text style={styles.bold}>Successful Services:</Text> {provider.successfulServices}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Location:</Text> {bookingDetails.location.name || "Unknown"}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Date:</Text> {formatDate(bookingDetails.date)}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Arrival Time:</Text> {convertTimeToAmPm(bookingDetails.arrivalTime)}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Duration:</Text> {bookingDetails.duration} hour(s)</Text>
          <Text style={styles.label}><Text style={styles.bold}>Payment Mode:</Text> {bookingDetails.payment}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Amount:</Text> ₹{bookingDetails.cost || "To be determined"}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Status:</Text> {bookingDetails.state}</Text>
          
          {bookingDetails?.otpUser && (
            <Text style={styles.label}><Text style={styles.bold}>OTP for Provider:</Text> {bookingDetails.otpUser}</Text>
          )} 

          {bookingDetails?.otpUser && bookingDetails.state === "approved" && (
            <View style={{ width: "100%", marginTop: 20 }}>
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
                style={[styles.submitBtn, { marginTop: 10, backgroundColor: "#3498db" }]}
                onPress={async () => {
                  if (enteredProviderOtp.length !== 6) {
                    Alert.alert("Invalid OTP", "OTP must be 6 digits");
                    return;
                  }

                  setOtpCheckLoading(true);

                  try {
                    const res = await fetch(`${config.BASE_URL}/verify-provider-otp`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        bookingId: bookingDetails.id,
                        otp: enteredProviderOtp,
                      }),
                    });

                    const result = await res.json();

                    if (res.ok && result.success) {
                      Alert.alert("OTP Verified", "Provider OTP matched successfully!");
                      setEnteredProviderOtp("");
                      fetchLatestBooking();
                    } else {
                      Alert.alert("Invalid OTP", result.message || "OTP did not match");
                    }
                  } catch (e) {
                    Alert.alert("Error", "Something went wrong during OTP verification.");
                    console.error("OTP verification error:", e);
                  } finally {
                    setOtpCheckLoading(false);
                  }
                }}
              >
                <Text style={styles.okText}>
                  {otpCheckLoading ? "Verifying..." : "Verify Provider OTP"}
                </Text>
              </TouchableOpacity>
            </View>
          )} 
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("ProviderDetail", { provider })}
          style={[styles.submitBtn, { backgroundColor: "#3498db", marginTop: 30 }]}
        >
          <Text style={styles.okText}>About Provider</Text>
        </TouchableOpacity>

        {(bookingDetails && bookingDetails.state !== "request sent") && (
          <TouchableOpacity
            onPress={() => navigation.navigate("BookingChat", {
              bookingId: bookingDetails.id,
              sender: "user",
              Username: bookingDetails.name || "User",
              state: bookingDetails.state === "completed"
            })}
            style={[styles.submitBtn, { backgroundColor: "#8e44ad", marginTop: 30 }]}
          >
            <Text style={styles.okText}>Chat with Provider</Text>
          </TouchableOpacity>
        )}

        {bookingDetails && (
          <>
            {(
              !(bookingDetails.state === "double confirmed" && hasQuarterPassed(bookingDetails)) && 
              !(bookingDetails.state === "completed")
            ) && (
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Cancel Booking",
                    "Are you sure you want to cancel your booking?",
                    [
                      { text: "Yes", onPress: handleUnbooking, style: "destructive" },
                      { text: "No", style: "cancel" },
                    ]
                  )
                }
                style={[styles.submitBtn, { backgroundColor: "#e74c3c", marginTop: 30 }]}
              >
                <Text style={styles.okText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}

            {bookingDetails.state === "double confirmed" && hasQuarterPassed(bookingDetails) && (
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: "#27ae60", marginTop: 30 }]}
                onPress={handleDonePress}
              >
                <Text style={styles.okText}>Done</Text>
              </TouchableOpacity>
            )}
          </>
        )}

      </ScrollView>

      <RatingModal
        visible={showRatingModal}
        booking={bookingDetails}
        provider={provider}
        onSubmit={async ({ stars, text }) => {
          try {
            const response = await fetch(`${config.BASE_URL}/rate-booking`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId: bookingDetails.id,
                providerId: bookingDetails.providerId,
                rating: stars,
                comment: text,
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to submit rating");
            }

            await markBookingAsRated(bookingDetails.id);

            Alert.alert("Thank you!", "Rating submitted successfully!");
            setShowRatingModal(false);
            navigation.goBack();
          } catch (err) {
            Alert.alert("Error", "Could not submit rating");
            console.error(err);
          }
        }}
        onSkip={async () => {
            setShowRatingModal(false);
        }}
      />

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
            <Text style={styles.modalTitle}>Reason for Cancellation</Text>
            {reasonOptions.map((reason, index) => (
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
                <Text style={{ marginVertical: 6, fontSize: 16, color: "#333" }}>
                  {selectedReasons.includes(reason) ? "☑" : "☐"} {reason}
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
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        sessionId,
                        bookingId: bookingDetails?.id,
                        reasons: allReasons,
                      }),
                    });

                    if (response.ok) {
                      setShowReasonModal(false);
                      setSelectedReasons([]);
                      setOtherReason("");
                      navigation.goBack();
                    } else {
                      Alert.alert("Error", "Failed to submit reason.");
                    }
                  } catch (error) {
                    console.error("Error submitting reason:", error);
                    Alert.alert("Error", "Something went wrong.");
                  }
                }}
                style={[styles.submitBtn, { backgroundColor: "#2ecc71" }]}
              >
                <Text style={styles.okText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowReasonModal(false)}
                style={[styles.modalCancel, { backgroundColor: "#d3d3d3" }]}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View> 
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  image: { width: 120, height: 120, borderRadius: 60, marginTop: 20, marginBottom: 20 },
  bookingCard: {
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    marginTop: 20,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginVertical: 4,
    color: "#333",
  },
  bold: {
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    marginTop: 16,
    justifyContent: 'center'
  },
  okText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "85%",
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 10 
  },
  modalOK: {
    backgroundColor: "#2ecc71",
    padding: 10,
    borderRadius: 6,
    marginTop: 16
  },
  modalCancel: {
    backgroundColor: "#d3d3d3",
    padding: 10,
    borderRadius: 6,
    marginTop: 16,
    alignItems: "center",
    flex: 1,
    marginLeft: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginTop: 10,
    borderRadius: 5
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16
  },
});

export default BookingScreen;