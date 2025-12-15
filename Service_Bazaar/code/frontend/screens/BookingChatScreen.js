import React, { useEffect, useState, useRef } from 'react';
import {
  View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet,
  Alert, Image, Modal, Dimensions, KeyboardAvoidingView, Platform,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import config from '../utils/config';
import Slider from '@react-native-community/slider'; 
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';

const { width } = Dimensions.get('window');

const BookingChatScreen = ({ route, navigation }) => {
  const { bookingId, sender, Username, state } = route.params || {}; 
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const recording = useRef(null);
  const sound = useRef(null);
  const textInputRef = useRef(null);
  const flatListRef = useRef(null);
  const isCompleted = state;
  console.log(isCompleted);

  useEffect(() => {
    const newSocket = io(config.BASE_URL);
    newSocket.emit('join-chat', { bookingId });

    newSocket.on('new-message', (data) => {
      if (data.bookingId === bookingId) {
        fetchChat();
      }
    });
  
    return () => {
      newSocket.emit('leave-chat', { bookingId });
      newSocket.close();
    };
  }, [bookingId]);

  useEffect(() => {
    if (!isCompleted && textInputRef.current) {
      const timer = setTimeout(() => {
        textInputRef.current?.focus();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  useEffect(() => {
    const keyboardWillShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardWillHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(keyboardWillShow, (e) => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    return () => {
      showListener?.remove();
      hideListener?.remove();
    };
  }, []);

  const CustomHeader = () => (
    <View style={styles.customHeader}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Image 
          source={{ 
            uri: 'https://icons.veryicon.com/png/o/miscellaneous/administration/account-25.png' 
          }} 
          style={styles.customerImage}
        />
        
        <Text style={styles.Username}>{Username}</Text>
      </View>
    </View>
  );

  const playAudioMessage = async (audioData, messageId) => {
    try {
      if (!audioData) {
        Alert.alert('Error', 'No audio data available to play');
        return;
      }

      if (currentPlayingId === messageId && sound.current) {
        try {
          const status = await sound.current.getStatusAsync();
          if (status.isLoaded) {
            if (status.isPlaying) {
              await sound.current.pauseAsync();
              setIsAudioPlaying(false);
            } else {
              await sound.current.playAsync();
              setIsAudioPlaying(true);
            }
            return;
          }
        } catch (error) {
          console.log('Sound status error, reloading:', error);
        }
      }

      if (sound.current) {
        try {
          await sound.current.unloadAsync();
        } catch (error) {
          console.log('Unload error:', error);
        }
        sound.current = null;
        setIsAudioPlaying(false);
        setCurrentPlayingId(null);
        setAudioPosition(0);
      }

      const audioBlob = `data:audio/m4a;base64,${audioData}`;
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioBlob },
        { shouldPlay: true, volume: 1.0 }
      );
      
      sound.current = newSound;
      setCurrentPlayingId(messageId);
      setIsAudioPlaying(true);
      setAudioPosition(0);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setAudioPosition(status.positionMillis || 0);
          
          if (status.didJustFinish) {
            setIsAudioPlaying(false);
            setAudioPosition(0);
            setCurrentPlayingId(null);
          }
        }
      });

    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Playback Error', 'Could not play voice message');
    }
  };

  const seekAudio = async (position) => {
    if (sound.current) {
      try {
        await sound.current.setPositionAsync(position);
        setAudioPosition(position);
      } catch (error) {
        console.error('Seek error:', error);
      }
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return "0:00";
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const messageDate = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.createdAt);
    const previousDate = new Date(previousMessage.createdAt);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const formatDateSeparator = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  const startVoiceMessage = async () => {
    if (isCompleted) {
      Alert.alert('Action Disabled', 'Recording is disabled for completed bookings.');
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone access required');
        return;
      }

      if (isRecording) {
        await stopVoiceMessage();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingObject = new Audio.Recording();
      await recordingObject.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
      });

      await recordingObject.startAsync();
      recording.current = recordingObject;
      setIsRecording(true);

    } catch (error) {
      console.error('Recording failed:', error);
      Alert.alert('Error', 'Could not start recording');
      setIsRecording(false);
    }
  };

  const stopVoiceMessage = async () => {
    if (!recording.current) {
      setIsRecording(false);
      return;
    }

    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      
      if (!uri) {
        throw new Error('Recording URI is null');
      }

      const recordingStatus = recording.current._finalDurationMillis || 0;

      // Read the file as Base64 using legacy API
      let base64Audio;
      try {
        base64Audio = await readAsStringAsync(uri, {
          encoding: EncodingType?.Base64 || 'base64',
        });
      } catch (encodingError) {
        console.error('Base64 encoding error:', encodingError);
        // Fallback: Read as binary and convert to Base64 manually
        const binaryData = await readAsStringAsync(uri, {
          encoding: EncodingType?.Binary || 'binary',
        });
        base64Audio = Buffer.from(binaryData, 'binary').toString('base64');
      }

      if (!base64Audio) {
        throw new Error('Failed to encode audio to Base64');
      }

      const response = await fetch(`${config.BASE_URL}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId, 
          sender, 
          text: '[VOICE_MESSAGE]',
          audioData: base64Audio,
          audioDuration: recordingStatus
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send voice message: ${response.status}`);
      }

      await fetchChat();

    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', `Could not send voice message: ${error.message}`);
    } finally {
      recording.current = null;
      setIsRecording(false);
    }
  };

  const fetchChat = async () => {
    try {
      const res = await fetch(`${config.BASE_URL}/chat/${bookingId}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Chat fetch error:', err);
    }
  };

  const sendMsg = async () => {
    if (isCompleted) {
      Alert.alert('Action Disabled', 'Messaging is disabled for completed bookings.');
      return;
    }

    if (!newMsg.trim()) return;
    try {
      await fetch(`${config.BASE_URL}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, sender, text: newMsg }),
      });
      setNewMsg('');
      await fetchChat();
    } catch (err) {
      console.error('Send error:', err);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderMessageItem = ({ item, index }) => {
    const previousMessage = messages[index - 1];
    const showDateSeparator = shouldShowDateSeparator(item, previousMessage);
    
    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatDateSeparator(item.createdAt)}
            </Text>
          </View>
        )}
        
        <View style={{
          padding: 10,
          backgroundColor: item.sender === sender ? '#dff9fb' : '#f6e58d',
          alignSelf: item.sender === sender ? 'flex-end' : 'flex-start',
          margin: 6,
          borderRadius: 10,
          maxWidth: '75%',
        }}>
          {item.text === '[VOICE_MESSAGE]' ? (
            <View style={styles.audioMessageContainer}>
              <TouchableOpacity 
                onPress={() => playAudioMessage(item.audioData, item.id)}
                style={styles.playButton}
              >
                <Ionicons 
                  name={currentPlayingId === item.id && isAudioPlaying ? "pause" : "play"} 
                  size={24} 
                  color="#007AFF" 
                />
              </TouchableOpacity>
              
              <View style={styles.audioControlsContainer}>
                <View style={styles.audioTimeContainer}>
                  <Text style={styles.audioTimeText}>
                    {currentPlayingId === item.id ? 
                      formatTime(audioPosition) : 
                      "0:00"}
                  </Text>
                  <Text style={styles.audioDivider}>/</Text>
                  <Text style={styles.audioTimeText}>
                    {formatTime(item.audioDuration || 0)}
                  </Text>
                </View>
                
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={item.audioDuration || 1000}
                  value={currentPlayingId === item.id ? audioPosition : 0}
                  onSlidingComplete={(value) => seekAudio(value)}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#ddd"
                  thumbTintColor="#007AFF"
                  disabled={currentPlayingId !== item.id}
                />
              </View>
            </View>
          ) : (
            <Text style={styles.messageText}>{item.text}</Text>
          )}
          
          <Text style={[
            styles.messageTime,
            { alignSelf: item.sender === sender ? 'flex-end' : 'flex-start' }
          ]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    fetchChat();
    const timer = setInterval(fetchChat, 4000);
    
    return () => {
      clearInterval(timer);
      if (sound.current) {
        sound.current.unloadAsync().catch(error => {
          console.log('Audio cleanup error:', error);
        });
      }
    };
  }, []);

  useEffect(() => {
    const keyboardWillShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardWillHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(keyboardWillShow, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideListener = Keyboard.addListener(keyboardWillHide, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showListener?.remove();
      hideListener?.remove();
    };
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <View edges={['top']} style={styles.safeAreaTop}>
        <CustomHeader />
      </View>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <Ionicons name="mic" size={20} color="white" />
          <Text style={styles.recordingText}>Recording... Tap to stop</Text>
          <TouchableOpacity onPress={stopVoiceMessage}>
            <Ionicons name="stop-circle" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          onPress={startVoiceMessage}
          style={[styles.recordButton, isRecording && styles.recordingActive, isCompleted && styles.disabledButton]}
          disabled={isCompleted}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={24} 
            color={isCompleted ? "#ccc" : (isRecording ? "#FF3B30" : "#007AFF")} 
          />
          <Text style={[styles.recordButtonText, isCompleted && styles.disabledText]}>
            {isRecording ? 'Stop Recording' : 'Record Voice Message'}
          </Text>
        </TouchableOpacity>
        <View style={[styles.inputWrapper, keyboardHeight > 0 && {
          marginBottom: keyboardHeight
        }]}>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Type a message..."
              ref={textInputRef} 
              style={[styles.input, isCompleted && styles.disabledInput]}
              value={newMsg}
              onChangeText={setNewMsg}
              editable={!isCompleted}
              returnKeyType="send"
              onSubmitEditing={sendMsg}
            />
            <TouchableOpacity 
              onPress={sendMsg} 
              style={[styles.sendBtn, isCompleted && styles.disabledButton]}
              disabled={isCompleted}
            >
              <Text style={[styles.sendBtnText, isCompleted && styles.disabledText]}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  safeAreaTop: {
    backgroundColor: '#f8f9fa',
  },
  safeAreaBottom: {
    backgroundColor: '#f9f9f9',
  },
  keyboardContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 15,
  },
  customerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  Username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    padding: 12,
    justifyContent: 'center',
  },
  recordingText: {
    color: 'white',
    marginHorizontal: 10,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
  },
  bottomContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderTopWidth: 1,
    borderTopColor: '#bbdefb',
  },
  recordingActive: {
    backgroundColor: '#ffebee',
  },
  recordButtonText: {
    marginLeft: 8,
    color: '#1976d2',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row', 
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  sendBtn: {
    backgroundColor: '#007AFF',
    marginLeft: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorText: {
    color: '#888',
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  audioMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 150,
    maxWidth: '100%',
  },
  playButton: {
    padding: 8,
  },
  audioControlsContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  audioTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  audioTimeText: {
    fontSize: 12,
    color: '#666',
    minWidth: 35,
    textAlign: 'center',
  },
  audioDivider: {
    fontSize: 12,
    color: '#666',
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  disabledText: {
    color: '#ccc',
  },
  disabledInput: {
    backgroundColor: '#e0e0e0',
    color: '#999',
  },
});

export default BookingChatScreen;