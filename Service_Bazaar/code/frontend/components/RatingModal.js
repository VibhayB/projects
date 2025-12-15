import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const capitalize = (str = "") => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
};

function StarRating({ rating, onRatingChange, size = 30 }) {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRatingChange(star)}
          style={styles.starButton}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? "#FFD700" : "#ccc"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function RatingModal({ visible, booking, provider, onSubmit, onSkip }) {
  const [stars, setStars] = useState(0); // No default stars
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [starClicked, setStarClicked] = useState(false); // Track if user clicked a star

  if (!booking || !provider) return null;

  const handleSubmit = async () => {
    if (stars === 0) {
      Alert.alert("Rating Required", "Please select a rating before submitting");
      return;
    }
    setSending(true);
    try {
      await onSubmit({ stars, text });
      setStars(0); // Reset to no stars
      setText("");
      setStarClicked(false);
    } finally {
      setSending(false);
    }
  };

  const handleSkip = async () => {
    try {
      await onSkip();
      setStars(0); // Reset to no stars
      setText("");
      setStarClicked(false);
    } catch (error) {
      console.error("Skip error:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <View style={styles.providerInfo}>
            <Image 
              source={{ 
                uri: provider.image || "https://icons.veryicon.com/png/o/miscellaneous/administration/account-25.png" 
              }} 
              style={styles.providerImage} 
            />
            <View style={styles.providerDetails}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.serviceName}>
                {provider.service ? capitalize(provider.service) : "Service"}
              </Text>
            </View>
          </View>

          <Text style={styles.ratingTitle}>How was your experience?</Text>

          <View style={styles.ratingContainer}>
            <StarRating 
              rating={stars} 
              onRatingChange={(value) => {
                setStars(value);
                setStarClicked(true); // Enable Submit on star click
              }} 
              size={36} 
            />
            <Text style={styles.ratingText}>
              {stars > 0 ? `${stars} star${stars !== 1 ? "s" : ""}` : "Tap to rate"}
            </Text>
          </View>

          <TextInput
            style={styles.textBox}
            placeholder="Add a comment (optional)"
            placeholderTextColor="#999"
            multiline
            value={text}
            onChangeText={setText}
            maxLength={500}
            textAlignVertical="top"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitBtn, 
                { 
                  backgroundColor: starClicked && stars > 0 ? "#00aa0bff" : "#006006ff",
                  opacity: starClicked && stars > 0 ? 1 : 0.6
                }
              ]}
              onPress={handleSubmit}
              disabled={sending || !starClicked || stars === 0}
            >
              <Text style={styles.buttonText}>
                {sending ? "Submitting..." : "Submit Rating"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkip}
              style={[styles.submitBtn, { backgroundColor: "#d3d3d3", marginTop: 10 }]}
              disabled={sending}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popup: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  providerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: "#666",
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  ratingContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  ratingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    fontWeight: "500",
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  starButton: {
    padding: 8,
    marginHorizontal: 2,
  },
  textBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    height: 80,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 16,
  },
  buttonContainer: {
    width: "100%",
  },
  submitBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff", // White text for both buttons
  }, skipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000ff", // White text for both buttons
  }
});

export { RatingModal, StarRating };