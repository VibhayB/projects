import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import axios from 'axios';

const SearchSignMenu = () => {
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictedSign, setPredictedSign] = useState(null);

  // Request gallery permissions on mount
  useEffect(() => {
    const requestGalleryPermission = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access media library is required!');
      }
    };
    requestGalleryPermission();
  }, []);

  // Pick video from gallery
  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Ensure only videos are picked
        quality: 1,
      });

      if (!result.canceled) {
        const videoAsset = result.assets[0]; // Use the first asset in the array
        console.log('Selected video URI:', videoAsset.uri); // Debug the URI
        setVideoUri(videoAsset.uri);
      } else {
        alert('No video selected.');
      }
    } catch (error) {
      console.error('Error picking video:', error);
    }
  };

  // Handle video upload
  const handleUploadVideo = async () => {
    if (!videoUri) {
      alert('Please select a video first!');
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
        setPredictedSign(response.data.predicted_sign);
      } else {
        alert('Unexpected server response.');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Recognition</Text>

      {videoUri ? (
        <Video
          source={{ uri: videoUri }}
          shouldPlay
          useNativeControls
          resizeMode="contain"
          style={styles.videoPreview}
        />
      ) : (
        <TouchableOpacity style={styles.button} onPress={pickVideo}>
          <Text style={styles.buttonText}>Upload Video</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={handleUploadVideo}>
        <Text style={styles.buttonText}>Submit for Check</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <Text style={styles.resultText}>
          {predictedSign ? `Predicted Sign: ${predictedSign}` : 'Upload a video to get a prediction.'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f5', // Soft background color
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  videoPreview: {
    width: '90%',
    height: 300,
    marginBottom: 20,
    borderRadius: 10, // Rounded corners for the video preview
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginVertical: 12,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, // Shadow for depth
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultText: {
    fontSize: 18,
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default SearchSignMenu;
