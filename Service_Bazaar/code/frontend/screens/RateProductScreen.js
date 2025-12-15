import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../utils/config';

export default function RateProductScreen({ route, navigation }) {
  const { itemId, itemName } = route.params;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState(null);

  useEffect(() => {
    checkExistingRating();
  }, []);

  const checkExistingRating = async () => {
    try {
      setLoading(true);
      const sessionId = await AsyncStorage.getItem('sessionId');

      const response = await fetch(
        `${config.BASE_URL}/user-product-rating/${itemId}?sessionId=${sessionId}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (data.hasRated) {
        setExistingRating(data);
        setRating(data.rating);
        setReview(data.review || '');
      }
    } catch (error) {
      console.error('Check rating error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    try {
      setSubmitting(true);
      const sessionId = await AsyncStorage.getItem('sessionId');

      const response = await fetch(
        `${config.BASE_URL}/rate-product`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            itemId,
            rating,
            review: review.trim()
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          existingRating ? 'Rating updated successfully' : 'Rating submitted successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(data.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Submit rating error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text style={[
              styles.starText,
              { color: star <= rating ? '#f39c12' : '#dee2e6' }
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8e44ad" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>
            {existingRating ? 'Edit Your Rating' : 'Rate This Product'}
          </Text>
          <Text style={styles.productName}>{itemName}</Text>

          <View style={styles.ratingSection}>
            <Text style={styles.sectionLabel}>Your Rating</Text>
            {renderStars()}
            <Text style={styles.ratingText}>
              {rating > 0 ? `${rating} out of 5 stars` : 'Tap to rate'}
            </Text>
          </View>

          <View style={styles.reviewSection}>
            <Text style={styles.sectionLabel}>Your Review (Optional)</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience with this product..."
              placeholderTextColor="#95a5a6"
              multiline
              numberOfLines={6}
              value={review}
              onChangeText={setReview}
              maxLength={500}
            />
            <Text style={styles.charCount}>{review.length}/500</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {existingRating ? 'Update Rating' : 'Submit Rating'}
              </Text>
            )}
          </TouchableOpacity>

          {existingRating && (
            <Text style={styles.updateNote}>
              You previously rated this product. You can update your rating anytime.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  productName: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 32,
    textAlign: 'center',
  },
  ratingSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  starText: {
    fontSize: 40,
  },
  ratingText: {
    fontSize: 14,
    color: '#6c757d',
  },
  reviewSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  reviewInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2c3e50',
    minHeight: 120,
    textAlignVertical: 'top',
    marginTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateNote: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});