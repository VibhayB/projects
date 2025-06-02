import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // Expo Image Picker
import { Video } from 'expo-av'; // Expo AV for video playback
import axios from 'axios';

const signs = ["good morning", "alright", "good afternoon", "how are you", "hello"]; // Predefined signs

const Quiz = ({ navigation }) => {
  const [currentSign, setCurrentSign] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [usedSigns, setUsedSigns] = useState([]);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(false);

  // Get random sign from the remaining list of signs
  const getRandomSign = () => {
    const remainingSigns = signs.filter(sign => !usedSigns.includes(sign));
    if (remainingSigns.length === 0) {
      Alert.alert("Quiz Completed", "You've gone through all the signs.");
      navigation.goBack();
      return null;
    }
    const randomSign = remainingSigns[Math.floor(Math.random() * remainingSigns.length)];
    setUsedSigns([...usedSigns, randomSign]);
    return randomSign;
  };

  useEffect(() => {
    const requestGalleryPermission = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermission(status === 'granted');
    };
  
    requestGalleryPermission();
    setCurrentSign(getRandomSign()); // Set the first sign to perform
  }, []);

  // Handle video picking
  const pickVideo = async () => {
    if (!hasGalleryPermission) {
      Alert.alert('Permission Required', 'Please grant permission to access the gallery.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Only allow video files
        quality: 1,
      });

      if (!result.canceled) {
        setVideoUri(result.assets[0].uri); // Set the video URI after picking the video
      } else {
        Alert.alert('No video selected');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'There was an error selecting the video.');
    }
  };

  // Handle video upload and validation
  const handleUploadVideo = async () => {
    if (!videoUri) {
      Alert.alert('No video', 'Please select a video.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: videoUri,
      type: 'video/mp4',
      name: 'video.mp4',
    });

    try {
      const response = await axios.post('http://192.168.93.104:5000/upload_video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.predicted_sign) {
        const predictedSign = response.data.predicted_sign;
        setIsCorrect(predictedSign === currentSign); // Check if the predicted sign matches
      } else {
        Alert.alert('Error', 'Unexpected server response.');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('Upload Failed', 'There was an error uploading the video.');
    } finally {
      setLoading(false);
    }
  };

  // Handle proceeding to next sign after checking the current one
  const handleNextSign = () => {
    setIsCorrect(null);
    setVideoUri(null);
    setCurrentSign(getRandomSign());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Practise Signs</Text>

      {/* Display current sign to perform */}
      {currentSign && (
        <Text style={styles.quizText}>Please perform the sign for: <Text style={styles.highlightText}>{currentSign}</Text></Text>
      )}

      {/* Display video preview if a video is selected */}
      {videoUri ? (
        <Video
          source={{ uri: videoUri }}
          shouldPlay
          useNativeControls
          resizeMode="contain"
          style={styles.videoPreview}
        />
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={pickVideo}>
            <Text style={styles.buttonText}>Upload Video</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Submit button to check if the video matches */}
      <TouchableOpacity style={styles.button} onPress={handleUploadVideo}>
        <Text style={styles.buttonText}>Submit for Check</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : isCorrect !== null ? (
        <Text style={styles.resultText}>
          {isCorrect ? 'Correct!' : 'Incorrect! Try Again.'}
        </Text>
      ) : (
        <Text style={styles.resultText}>Upload a video to check your answer.</Text>
      )}

      {/* Button to move to next sign */}
      {isCorrect !== null && (
        <TouchableOpacity style={styles.nextButton} onPress={handleNextSign}>
          <Text style={styles.nextButtonText}>Next Sign</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9', // Light background for better readability
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  quizText: {
    fontSize: 20,
    marginBottom: 20,
    color: '#555',
    textAlign: 'center',
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  videoPreview: {
    width: '90%',
    height: 250,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    marginHorizontal: 10,
    minWidth: 200, // Ensure buttons have consistent width
    alignItems: 'center',
    elevation: 4, // Shadow for depth
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultText: {
    fontSize: 18,
    color: '#007bff',
    marginTop: 20,
    textAlign: 'center',
  },
  nextButton: {
    marginTop: 20,
    backgroundColor: '#28a745',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Quiz;
