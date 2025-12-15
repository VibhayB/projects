import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import config from '../utils/config';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const BookingModal = ({ visible, provider, sessionId, userSelectedLocation, locationDisplayName, onClose, onBookingSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedMinute, setSelectedMinute] = useState(null);
  const [selectedDurationDays, setSelectedDurationDays] = useState(0);
  const [selectedDurationHours, setSelectedDurationHours] = useState(0);
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState(0);
  const [availableRanges, setAvailableRanges] = useState([]);
  const [dateAvailability, setDateAvailability] = useState({});
  const [hourAvailability, setHourAvailability] = useState({});
  const [minuteAvailability, setMinuteAvailability] = useState({});
  const [currentStep, setCurrentStep] = useState('date');
  const [providerAvailability, setProviderAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [internalVisible, setInternalVisible] = useState(false);
  const [availableDurations, setAvailableDurations] = useState({
    days: [],
    hours: [],
    minutes: []
  });
  const [calculatedCost, setCalculatedCost] = useState(null);
  const [costLoading, setCostLoading] = useState(false);
  const [costError, setCostError] = useState(null);

  // Format date to YYYY-MM-DD
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate total duration in hours
  const calculateDuration = (days, hours, minutes) => {
    return parseFloat(((days || 0) * 24 + (hours || 0) + (minutes || 0) / 60).toFixed(2));
  };

  // Calculate available time ranges from bookings
  const calculateAvailableRanges = (bookings) => {
    if (!bookings || bookings.length === 0) {
      const now = new Date();
      const farFuture = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      return [{
        start: now,
        end: farFuture,
        duration: Infinity
      }];
    }

    const sortedBookings = bookings
      .map(booking => ({
        start: new Date(booking.start),
        end: new Date(booking.end)
      }))
      .sort((a, b) => a.start - b.start);

    const ranges = [];
    const now = new Date();

    // First range: from now to first booking
    if (sortedBookings[0].start > now) {
      const duration = (sortedBookings[0].start - now) / (1000 * 60);
      if (duration >= 20) {
        ranges.push({
          start: now,
          end: sortedBookings[0].start,
          duration: duration
        });
      }
    }

    // Middle ranges: gaps between bookings
    for (let i = 0; i < sortedBookings.length - 1; i++) {
      const gapStart = sortedBookings[i].end;
      const gapEnd = sortedBookings[i + 1].start;
      const duration = (gapEnd - gapStart) / (1000 * 60);
      
      if (duration >= 20) {
        ranges.push({
          start: gapStart,
          end: gapEnd,
          duration: duration
        });
      }
    }

    // Last range: from last booking to far future
    const lastBooking = sortedBookings[sortedBookings.length - 1];
    const farFuture = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (lastBooking.end < farFuture) {
      ranges.push({
        start: lastBooking.end,
        end: farFuture,
        duration: Infinity
      });
    }

    return ranges;
  };

  // Check if date is available
  const isDateAvailable = (date, ranges) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return ranges.some(range => 
      range.start <= endOfDay && range.end >= startOfDay &&
      (range.end - Math.max(range.start, startOfDay)) >= 20 * 60 * 1000
    );
  };

  // Check if hour is available
  const isHourAvailable = (date, hour, ranges) => {
    const hourStart = new Date(date);
    hourStart.setHours(hour, 0, 0, 0);
    const hourEnd = new Date(date);
    hourEnd.setHours(hour, 59, 59, 999);

    return ranges.some(range => {
      const overlapStart = Math.max(range.start.getTime(), hourStart.getTime());
      const overlapEnd = Math.min(range.end.getTime(), hourEnd.getTime());
      const overlapDuration = overlapEnd - overlapStart;
      
      return overlapDuration >= 20 * 60 * 1000;
    });
  };

  // Check if minute is available
  const isMinuteAvailable = (date, hour, minute, ranges) => {
    const startTime = new Date(date);
    startTime.setHours(hour, minute, 0, 0);
    const twentyMinutesLater = new Date(startTime.getTime() + 20 * 60 * 1000);

    return ranges.some(range => 
      range.start <= startTime && range.end >= twentyMinutesLater
    );
  };

  // Check if duration is valid
  const isDurationValid = (startDate, startHour, startMinute, durationDays, durationHours, durationMinutes, ranges) => {
    if (startHour === null || startMinute === null || (durationDays === 0 && durationHours === 0 && durationMinutes === 0)) {
      return false;
    }

    const totalMinutes = (durationDays * 24 * 60) + (durationHours * 60) + durationMinutes;
    if (totalMinutes < 20) {
      return false;
    }

    const startTime = new Date(startDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    const endTime = new Date(startTime.getTime() + totalMinutes * 60 * 1000);

    return ranges.some(range => 
      range.start <= startTime && range.end >= endTime
    );
  };

  // Get available durations based on selected time
  const getAvailableDurations = (startDate, startHour, startMinute, ranges) => {
    const startTime = new Date(startDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const availableDurations = {
      days: [],
      hours: [],
      minutes: []
    };

    const containingRange = ranges.find(range => 
      range.start <= startTime && range.end >= startTime
    );

    if (!containingRange) {
      return availableDurations;
    }

    const maxDurationMinutes = (containingRange.end - startTime) / (1000 * 60);
    
    for (let days = 0; days <= 14; days++) {
      const durationMinutes = days * 24 * 60;
      if (durationMinutes <= maxDurationMinutes) {
        availableDurations.days.push(days);
      }
    }

    for (let hours = 0; hours < 24; hours++) {
      const durationMinutes = hours * 60;
      if (durationMinutes <= maxDurationMinutes) {
        availableDurations.hours.push(hours);
      }
    }

    for (let minutes = 0; minutes < 60; minutes++) {
      if (minutes <= maxDurationMinutes) {
        availableDurations.minutes.push(minutes);
      }
    }

    return availableDurations;
  };

  // Generate date availability map
  const generateDateAvailability = (ranges) => {
    const availability = {};
    const now = new Date();
    
    for (let i = 0; i < 90; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + i);
      const dateKey = formatDate(checkDate);
      availability[dateKey] = isDateAvailable(checkDate, ranges);
    }
    
    return availability;
  };

  // Generate hour availability map
  const generateHourAvailability = (date, ranges) => {
    const availability = {};
    const now = new Date();
    
    for (let hour = 0; hour < 24; hour++) {
      const checkTime = new Date(date);
      checkTime.setHours(hour, 0, 0, 0);
      
      if (formatDate(date) === formatDate(now) && checkTime <= now) {
        availability[hour] = false;
      } else {
        availability[hour] = isHourAvailable(date, hour, ranges);
      }
    }
    
    return availability;
  };

  // Generate minute availability map
  const generateMinuteAvailability = (date, hour, ranges) => {
    const availability = {};
    const now = new Date();
    
    for (let minute = 0; minute < 60; minute++) {
      const checkTime = new Date(date);
      checkTime.setHours(hour, minute, 0, 0);
      
      if (formatDate(date) === formatDate(now) && 
          date.getHours() === now.getHours() && 
          checkTime <= now) {
        availability[minute] = false;
      } else {
        availability[minute] = isMinuteAvailable(date, hour, minute, ranges);
      }
    }
    
    return availability;
  };

  // Fetch provider availability
  const fetchProviderAvailability = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${config.BASE_URL}/provider-availability/${provider.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch provider availability');
      }
      
      const data = await response.json();
      setProviderAvailability(data);
      
      const ranges = calculateAvailableRanges(data);
      setAvailableRanges(ranges);
      
      const dateAvail = generateDateAvailability(ranges);
      setDateAvailability(dateAvail);
      
      setIsDataLoaded(true);
      
    } catch (e) {
      console.error('Error fetching provider availability:', e);
      Alert.alert('Error', 'Failed to load provider availability. Please try again.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate cost function
  const handleProceedToPayment = async () => {
    if (!isBookingValid()) {
      Alert.alert('Invalid Selection', 'Please ensure all booking details are valid.');
      return;
    }

    setCostLoading(true);
    setCostError(null);
    
    try {
      const duration = calculateDuration(selectedDurationDays, selectedDurationHours, selectedDurationMinutes);
      const formattedDate = formatDate(selectedDate);
      const formattedTime = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;

      const costRequest = {
        providerId: provider.id,
        date: formattedDate,
        arrivalTime: formattedTime,
        duration: duration,
        userLocation: userSelectedLocation ? {
          lat: userSelectedLocation.lat,
          lng: userSelectedLocation.lng
        } : null
      };

      const response = await fetch(`${config.BASE_URL}/calculate-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(costRequest),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate cost');
      }

      const costData = await response.json();
      setCalculatedCost(costData.cost);
      setCurrentStep('payment');
      
    } catch (error) {
      console.error('Error calculating cost:', error);
      setCostError('Unable to calculate cost. Please try again.');
      setCalculatedCost(null);
    } finally {
      setCostLoading(false);
    }
  };

  // Handle cash booking
  const handleCashBooking = async () => {
  if (!isBookingValid() || !calculatedCost) {
    Alert.alert('Error', 'Please complete the booking details and cost calculation.');
    return;
  }

  const duration = calculateDuration(selectedDurationDays, selectedDurationHours, selectedDurationMinutes);
  const formattedDate = formatDate(selectedDate);
  const formattedTime = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
  
  try {
    if (!sessionId) return Alert.alert('Error', 'User not authenticated.');

    const { id: providerId, ...rest } = provider;

    const bookingWithDate = {
      ...rest,
      providerId,
      date: formattedDate,
      arrivalTime: formattedTime,
      duration,
      payment: 'Cash after Service',
      sessionId,
      location: userSelectedLocation ? {
        lat: userSelectedLocation.lat,
        lng: userSelectedLocation.lng,
        name: locationDisplayName
      } : null
    };

    const res = await fetch(`${config.BASE_URL}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingWithDate),
    });

    const json = await res.json();
    if (res.ok) {
      Alert.alert('Booking Confirmed', `${provider.name} has been booked for ₹${calculatedCost}.`);
      onBookingSuccess();
      onClose();
    } else {
      Alert.alert('Booking Failed', json.message || 'Try again.');
    }
  } catch (e) {
    console.error(e);
    Alert.alert('Error', 'Could not complete booking.');
  }
};

const handleOnlinePayment = () => {
  if (!isBookingValid() || !calculatedCost) {
    Alert.alert('Error', 'Please complete the booking details and cost calculation.');
    return;
  }

  const amount = Math.round(calculatedCost * 100); // Convert to paise

  const options = {
    description: 'Service Payment',
    image: 'https://your-logo-url.com/logo.png',
    currency: 'INR',
    key: 'YOUR_RAZORPAY_KEY',
    amount: amount.toString(),
    name: provider.name,
    prefill: {
      email: 'example@email.com',
      contact: '9999999999',
      name: 'Your Name',
    },
    theme: { color: '#53a20e' },
  };

  RazorpayCheckout.open(options)
    .then(async (data) => {
      const duration = calculateDuration(selectedDurationDays, selectedDurationHours, selectedDurationMinutes);
      const formattedDate = formatDate(selectedDate);
      const formattedTime = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;

      const { id: providerId, ...rest } = provider;

      const bookingWithDate = {
        ...rest,
        providerId,
        date: formattedDate,
        arrivalTime: formattedTime,
        duration,
        payment: 'Paid Online',
        paymentId: data.razorpay_payment_id,
        sessionId,
        location: userSelectedLocation ? {
          lat: userSelectedLocation.lat,
          lng: userSelectedLocation.lng,
          name: locationDisplayName
        } : null
      };

      const res = await fetch(`${config.BASE_URL}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingWithDate),
      });

      if (res.ok) {
        Alert.alert('Payment Success', `${provider.name} has been booked. Amount paid: ₹${calculatedCost}`);
        onBookingSuccess();
        onClose();
      } else {
        Alert.alert('Booking Failed', 'Could not complete booking.');
      }
    })
    .catch(error => {
      Alert.alert('Payment Failed', 'Transaction was not completed.');
      console.error('Payment error:', error);
    });
};

  // Step validation
  const isStepValid = () => {
    switch (currentStep) {
      case 'date':
        return dateAvailability[formatDate(selectedDate)] || false;
      case 'time':
        return selectedHour !== null && 
               selectedMinute !== null && 
               (hourAvailability[selectedHour] || false) && 
               (minuteAvailability[selectedMinute] || false);
      case 'duration':
        return selectedDurationDays !== null && 
               selectedDurationHours !== null && 
               selectedDurationMinutes !== null &&
               isDurationValid(
                 selectedDate, 
                 selectedHour, 
                 selectedMinute, 
                 selectedDurationDays, 
                 selectedDurationHours, 
                 selectedDurationMinutes, 
                 availableRanges
               );
      case 'payment':
        return isBookingValid() && calculatedCost !== null;
      default:
        return false;
    }
  };

  const isBookingValid = () => {
    return selectedHour !== null && 
           selectedMinute !== null && 
           isDurationValid(selectedDate, selectedHour, selectedMinute, selectedDurationDays, selectedDurationHours, selectedDurationMinutes, availableRanges);
  };

  // Navigation handlers
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedHour(null);
    setSelectedMinute(null);
    setSelectedDurationDays(0);
    setSelectedDurationHours(0);
    setSelectedDurationMinutes(0);
    setCurrentStep('time');
  };

  const handleTimeSelect = () => {
    if (selectedHour !== null && selectedMinute !== null) {
      setSelectedDurationDays(0);
      setSelectedDurationHours(0);
      setSelectedDurationMinutes(0);
      setCurrentStep('duration');
    }
  };

  const handleBackStep = () => {
    if (currentStep === 'time') {
      setCurrentStep('date');
    } else if (currentStep === 'duration') {
      setCurrentStep('time');
    } else if (currentStep === 'payment') {
      setCurrentStep('duration');
      setCalculatedCost(null);
    } else {
      onClose();
    }
  };

  // Effects
  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      setIsLoading(true);
      setIsDataLoaded(false);
      setCurrentStep('date');
      setSelectedDate(new Date());
      setSelectedHour(null);
      setSelectedMinute(null);
      setSelectedDurationDays(0);
      setSelectedDurationHours(0);
      setSelectedDurationMinutes(0);
      setCalculatedCost(null);
      setCostError(null);
      
      fetchProviderAvailability();
    } else {
      setInternalVisible(false);
      setIsDataLoaded(false);
    }
  }, [visible, provider]);

  useEffect(() => {
    if (selectedDate && availableRanges.length > 0) {
      const hourAvail = generateHourAvailability(selectedDate, availableRanges);
      setHourAvailability(hourAvail);
    }
  }, [selectedDate, availableRanges]);

  useEffect(() => {
    if (selectedDate && selectedHour !== null && availableRanges.length > 0) {
      const minAvail = generateMinuteAvailability(selectedDate, selectedHour, availableRanges);
      setMinuteAvailability(minAvail);
    } else {
      setMinuteAvailability({});
    }
  }, [selectedHour, selectedDate, availableRanges]);

  useEffect(() => {
    if (selectedDate && selectedHour !== null && selectedMinute !== null && availableRanges.length > 0) {
      const durations = getAvailableDurations(
        selectedDate, 
        selectedHour, 
        selectedMinute, 
        availableRanges
      );
      setAvailableDurations(durations);
    }
  }, [selectedDate, selectedHour, selectedMinute, availableRanges]);

  // Calendar Component
  const CustomCalendar = ({ onDateSelect, selectedDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    useEffect(() => {
      if (selectedDate) {
        setCurrentMonth(selectedDate.getMonth());
        setCurrentYear(selectedDate.getFullYear());
      }
    }, [selectedDate]);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const renderDaysInMonth = (month, year) => {
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days = [];

      for (let i = 0; i < firstDay; i++) {
        days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dateStr = formatDate(dateObj);
        const isAvailable = dateAvailability[dateStr] || false;
        const isSelected = dateStr === formatDate(selectedDate);
        const isToday = dateStr === formatDate(new Date());

        days.push(
          <TouchableOpacity
            key={day}
            style={[
              styles.calendarDay,
              !isAvailable && styles.calendarDayDisabled,
              isSelected && styles.calendarDaySelected,
              isToday && styles.calendarDayToday
            ]}
            onPress={() => isAvailable && onDateSelect(dateObj)}
            disabled={!isAvailable}
          >
            <Text style={[
              styles.calendarDayText,
              !isAvailable && styles.calendarDayTextDisabled,
              isSelected && styles.calendarDayTextSelected
            ]}>
              {day}
            </Text>
            {!isAvailable && <View style={styles.unavailableIndicator} />}
          </TouchableOpacity>
        );
      }

      return days;
    };

    const handlePrevMonth = () => {
      setCurrentMonth(currentMonth === 0 ? 11 : currentMonth - 1);
      if (currentMonth === 0) setCurrentYear(currentYear - 1);
    };

    const handleNextMonth = () => {
      setCurrentMonth(currentMonth === 11 ? 0 : currentMonth + 1);
      if (currentMonth === 11) setCurrentYear(currentYear + 1);
    };

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={handlePrevMonth}>
            <Ionicons name="chevron-back" size={24} color="#007bff" />
          </TouchableOpacity>
          <Text style={styles.calendarHeaderText}>{monthNames[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={handleNextMonth}>
            <Ionicons name="chevron-forward" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarWeekHeader}>
          {daysOfWeek.map(day => (
            <Text key={day} style={styles.calendarWeekDay}>{day}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {renderDaysInMonth(currentMonth, currentYear)}
        </View>
      </View>
    );
  };

  // Swipeable Picker Component
  const SwipeablePicker = ({ values, selectedValue, onSelect, isAvailable, availableValues = null }) => {
    const itemHeight = 34;
    const scrollViewRef = useRef(null);
    const isScrollingProgrammatically = useRef(false);
    
    const effectiveAvailableValues = availableValues || (isAvailable ? values.filter(value => isAvailable(value)) : values);
    const containerHeight = 100;
    const visibleItems = Math.floor(containerHeight / itemHeight);
    const paddingVertical = Math.floor(visibleItems / 2) * itemHeight;

    useEffect(() => {
      if (selectedValue !== null && selectedValue !== undefined) {
        const index = values.indexOf(selectedValue);
        if (index !== -1) {
          isScrollingProgrammatically.current = true;
          const offsetY = index * itemHeight;
          scrollViewRef.current?.scrollTo({ y: offsetY, animated: false });
          setTimeout(() => { isScrollingProgrammatically.current = false; }, 50);
        }
      }
    }, [selectedValue, values]);

    const handleMomentumScrollEnd = (event) => {
      if (isScrollingProgrammatically.current) return;
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / itemHeight);
      const clampedIndex = Math.max(0, Math.min(index, values.length - 1));
      const newValue = values[clampedIndex];
      if (newValue !== undefined && newValue !== selectedValue) {
        onSelect(newValue);
      }
    };

    return (
      <View style={styles.pickerContainer}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollBeginDrag={() => { isScrollingProgrammatically.current = false; }}
          bounces={false}
          contentContainerStyle={{ paddingTop: paddingVertical, paddingBottom: paddingVertical }}
        >
          {values.map((value, idx) => {
            const isValueAvailable = effectiveAvailableValues.includes(value);
            return (
              <View key={`${value}-${idx}`} style={[styles.pickerItem, !isValueAvailable && styles.pickerItemDisabled]}>
                <Text style={[
                  styles.pickerItemText,
                  selectedValue === value && styles.pickerItemTextSelected,
                  !isValueAvailable && styles.pickerItemTextDisabled
                ]}>
                  {String(value).padStart(2, '0')}
                </Text>
                {!isValueAvailable && <View style={styles.unavailableIndicatorSmall} />}
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.pickerSelectionIndicator} />
        <View style={styles.pickerMaskTop} />
        <View style={styles.pickerMaskBottom} />
      </View>
    );
  };

  return (
    <Modal visible={internalVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isLoading ? 'Loading Availability...' : 
               currentStep === 'payment' ? 'Confirm & Pay' : 'Select Booking Details'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isLoading}>
              <Ionicons name="close" size={24} color={isLoading ? '#ccc' : '#666'} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Loading provider availability...</Text>
            </View>
          ) : !isDataLoaded ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={48} color="#dc3545" />
              <Text style={styles.errorText}>Failed to load availability data</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchProviderAvailability}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Date Selection */}
              {currentStep === 'date' && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Select Date</Text>
                  <CustomCalendar onDateSelect={handleDateSelect} selectedDate={selectedDate} />
                  <Text style={styles.availabilityHint}>Grayed out dates are completely booked</Text>
                </View>
              )}

              {/* Time Selection */}
              {currentStep === 'time' && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Select Time</Text>
                  <View style={styles.timePickerContainer}>
                    <View style={styles.pickerCell}>
                      <Text style={styles.pickerLabel}>Hour</Text>
                      <SwipeablePicker
                        values={Array.from({length: 24}, (_, i) => i)}
                        selectedValue={selectedHour}
                        onSelect={setSelectedHour}
                        isAvailable={(h) => hourAvailability[h] || false}
                      />
                    </View>
                    <View style={styles.pickerCell}>
                      <Text style={styles.pickerLabel}>Minute</Text>
                      <SwipeablePicker
                        values={Array.from({length: 60}, (_, i) => i)}
                        selectedValue={selectedMinute}
                        onSelect={setSelectedMinute}
                        isAvailable={(m) => minuteAvailability[m] || false}
                      />
                    </View>
                  </View>
                  <Text style={styles.availabilityHint}>Grayed out times are booked or unavailable</Text>
                </View>
              )}

              {/* Duration Selection */}
              {currentStep === 'duration' && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Select Duration</Text>
                  {availableDurations.days.length === 0 && availableDurations.hours.length === 0 && availableDurations.minutes.length === 0 ? (
                    <View style={styles.noAvailabilityContainer}>
                      <Ionicons name="time-outline" size={32} color="#856404" />
                      <Text style={styles.noAvailabilityText}>No available duration for the selected time.{'\n'}Please choose a different time slot.</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.durationPickerContainer}>
                        <View style={styles.pickerCell}>
                          <Text style={styles.pickerLabel}>Days</Text>
                          <SwipeablePicker
                            values={Array.from({length: 15}, (_, i) => i)}
                            selectedValue={selectedDurationDays}
                            onSelect={setSelectedDurationDays}
                            availableValues={availableDurations.days}
                          />
                        </View>
                        <View style={styles.pickerCell}>
                          <Text style={styles.pickerLabel}>Hours</Text>
                          <SwipeablePicker
                            values={Array.from({length: 24}, (_, i) => i)}
                            selectedValue={selectedDurationHours}
                            onSelect={setSelectedDurationHours}
                            availableValues={availableDurations.hours}
                          />
                        </View>
                        <View style={styles.pickerCell}>
                          <Text style={styles.pickerLabel}>Minutes</Text>
                          <SwipeablePicker
                            values={Array.from({length: 60}, (_, i) => i)}
                            selectedValue={selectedDurationMinutes}
                            onSelect={setSelectedDurationMinutes}
                            availableValues={availableDurations.minutes}
                          />
                        </View>
                      </View>
                      <Text style={styles.availabilityHint}>Grayed out durations would conflict with existing bookings</Text>
                    </>
                  )}
                </View>
              )}

              {/* Payment Step */}
              {currentStep === 'payment' && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Confirm Booking & Pay</Text>
                  
                  {/* Booking Summary */}
                  <View style={styles.bookingSummary}>
                    <Text style={styles.bookingSummaryTitle}>Booking Details</Text>
                    <View style={styles.bookingDetailRow}>
                      <Text style={styles.bookingDetailLabel}>Date:</Text>
                      <Text style={styles.bookingDetailValue}>{selectedDate.toDateString()}</Text>
                    </View>
                    <View style={styles.bookingDetailRow}>
                      <Text style={styles.bookingDetailLabel}>Time:</Text>
                      <Text style={styles.bookingDetailValue}>
                        {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
                      </Text>
                    </View>
                    <View style={styles.bookingDetailRow}>
                      <Text style={styles.bookingDetailLabel}>Duration:</Text>
                      <Text style={styles.bookingDetailValue}>
                        {String(selectedDurationDays).padStart(2, '0')}d {String(selectedDurationHours).padStart(2, '0')}h {String(selectedDurationMinutes).padStart(2, '0')}m
                        {' '}({calculateDuration(selectedDurationDays, selectedDurationHours, selectedDurationMinutes)} hours)
                      </Text>
                    </View>
                    
                    {/* Cost Display */}
                    {costLoading ? (
                      <View style={styles.costLoading}>
                        <ActivityIndicator size="small" color="#007bff" />
                        <Text style={styles.costLoadingText}>Calculating cost...</Text>
                      </View>
                    ) : costError ? (
                      <Text style={styles.costError}>{costError}</Text>
                    ) : calculatedCost ? (
                      <View style={styles.costContainer}>
                        <View style={styles.costDisplay}>
                          <Text style={styles.costLabel}>Estimated Booking Cost:</Text>
                          <Text style={styles.costAmount}>₹{calculatedCost}</Text>
                        </View>
                        <Text style={styles.costDisclaimer}>
                          *This is the estimated booking cost. Final cost after service completion may vary based on actual work requirements.
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Payment Options */}
                  <View style={styles.paymentSection}>
                    <Text style={styles.paymentSectionTitle}>Select Payment Method</Text>
                    <View style={styles.paymentOptions}>
                      <TouchableOpacity
                        style={[styles.paymentOption, !calculatedCost && styles.paymentOptionDisabled]}
                        onPress={handleCashBooking}
                        disabled={!calculatedCost}
                      >
                        <Ionicons name="cash" size={24} color="#27ae60" />
                        <View style={styles.paymentOptionContent}>
                          <Text style={styles.paymentOptionText}>Cash after Service</Text>
                          <Text style={styles.paymentOptionDescription}>Pay after the service is completed</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.paymentOption, !calculatedCost && styles.paymentOptionDisabled]}
                        onPress={handleOnlinePayment}
                        disabled={!calculatedCost}
                      >
                        <Ionicons name="card" size={24} color="#2980b9" />
                        <View style={styles.paymentOptionContent}>
                          <Text style={styles.paymentOptionText}>Online Payment</Text>
                          <Text style={styles.paymentOptionDescription}>Pay securely online now</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Navigation Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleBackStep}>
                  <Text style={styles.cancelButtonText}>
                    {currentStep === 'payment' ? 'Back to Duration' : 'Back'}
                  </Text>
                </TouchableOpacity>
                
                {currentStep !== 'payment' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.continueButton, !isStepValid() && styles.continueButtonDisabled]}
                    onPress={() => {
                      if (currentStep === 'date') setCurrentStep('time');
                      else if (currentStep === 'time') handleTimeSelect();
                      else if (currentStep === 'duration') handleProceedToPayment();
                    }}
                    disabled={!isStepValid()}
                  >
                    <Text style={styles.continueButtonText}>
                      {currentStep === 'duration' ? 'Calculate Cost & Continue' : 'Next'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  calendarContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    color: '#666',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: (width - 80) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: 'white',
    marginBottom: 4,
    position: 'relative',
  },
  calendarDayEmpty: {
    width: (width - 80) / 7,
    height: 40,
  },
  calendarDayDisabled: {
    backgroundColor: '#f5f5f5',
  },
  calendarDaySelected: {
    backgroundColor: '#007bff',
  },
  calendarDayToday: {
    backgroundColor: '#e3f2fd',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  calendarDayTextDisabled: {
    color: '#999',
  },
  calendarDayTextSelected: {
    color: 'white',
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  durationPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  pickerCell: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  pickerContainer: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  pickerItem: {
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    position: 'relative',
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  pickerItemTextSelected: {
    color: '#007bff',
    fontWeight: '600',
  },
  pickerItemTextDisabled: {
    color: '#ccc',
  },
  pickerItemDisabled: {
    backgroundColor: '#f8f9fa',
  },
  pickerSelectionIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 34,
    marginTop: -17,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#007bff',
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
    pointerEvents: 'none',
  },
  pickerMaskTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 33,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
  },
  pickerMaskBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 33,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
  },
  selectedTimeContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 20,
  },
  selectedTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#007bff',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  paymentSection: {
    marginTop: 24,
  },
  paymentSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  paymentOptions: {
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentOptionDisabled: {
    opacity: 0.6,
  },
  paymentOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  paymentOptionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bookingSummary: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 0,
  },
  bookingSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  bookingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  bookingDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  costContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  costDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  costAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
  },
  costDisclaimer: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  costLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  costLoadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  costError: {
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center',
    padding: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noAvailabilityContainer: {
    padding: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    alignItems: 'center',
  },
  noAvailabilityText: {
    color: '#856404',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  availabilityHint: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  unavailableIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc3545',
  },
  unavailableIndicatorSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#dc3545',
  },
});

export default BookingModal;