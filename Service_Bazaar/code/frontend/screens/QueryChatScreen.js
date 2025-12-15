import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, 
  ActivityIndicator, Alert, Platform, Keyboard
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Icon from 'react-native-vector-icons/MaterialIcons';
import config from '../utils/config';

const QueryChatScreen = ({ route, navigation }) => {
  const { newChat, threadId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [threadId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Keyboard listeners to track actual keyboard height
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

  const loadData = async () => {
    try {
      const sid = await AsyncStorage.getItem('sessionId');
      setSessionId(sid);

      if (!newChat && threadId) {
        await loadThreadMessages(threadId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const loadThreadMessages = async (threadId) => {
    try {
      setLoading(true);
      const res = await fetch(`${config.BASE_URL}/query-thread/${threadId}`);
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      const messagesData = data.messages || [];
      
      const messagesWithIds = messagesData.map((msg, index) => ({
        ...msg,
        id: msg.id || `${msg.sender}-${index}-${Date.now()}`
      }));
      
      setMessages(messagesWithIds);
    } catch (error) {
      console.error('Error loading thread messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTextWithBold = (text) => {
    if (!text) return null;
    
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={{ fontWeight: 'bold' }}>
            {part.replace(/\*\*/g, '')}
          </Text>
        );
      }
      return part;
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !sessionId) return;
    
    setSending(true);
    const userMessage = input;
    setInput('');

    try {
      let currentThreadId = threadId;

      const userMessageObj = {
        text: userMessage,
        sender: 'user',
        id: `user-${Date.now()}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMessageObj]);

      if (newChat && !currentThreadId) {
        const threadRes = await fetch(`${config.BASE_URL}/create-query-thread`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, title: userMessage }),
        });
        
        const threadData = await threadRes.json();
        if (threadData.threadId) {
          currentThreadId = threadData.threadId;
          navigation.setParams({ threadId: currentThreadId, newChat: false });
        }
      }

      const payload = { sessionId, text: userMessage, threadId: currentThreadId };
      const res = await fetch(`${config.BASE_URL}/send-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error('Failed to send message');
      
      const data = await res.json();

      if (data.reply) {
        const aiMessageObj = {
          text: data.reply,
          sender: 'ai',
          id: `ai-${Date.now()}`,
          timestamp: Date.now(),
          recommendedServices: data.recommendedServices || null
        };
        setMessages(prev => [...prev, aiMessageObj]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInput(userMessage);
    } finally {
      setSending(false);
    }
  };

  const copyMessage = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', 'Message copied to clipboard');
    } catch (error) {
      console.error('Error copying message:', error);
      Alert.alert('Error', 'Failed to copy message. Please try again.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.messageContainer}>
      <TouchableOpacity
        onLongPress={() => copyMessage(item.text)}
        style={[styles.msg, item.sender === 'user' ? styles.userMsg : styles.otherMsg]}
      >
        <Text 
          style={[styles.messageText, item.sender === 'user' ? styles.userMessageText : styles.aiMessageText]}
        >
          {formatTextWithBold(item.text)}
        </Text>
      </TouchableOpacity>
      
      {item.recommendedServices && item.sender === 'ai' && (
        <View style={styles.servicesOuterContainer}>
          <Text style={styles.servicesTitle}>Recommended Services:</Text>
          <View style={styles.servicesGrid}>
            {item.recommendedServices.map(service => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceButton}
                onPress={() => navigation.navigate('Providers', { 
                  serviceId: service.id,
                  title: service.title 
                })}
              >
                <Text style={styles.serviceButtonText}>{service.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Query AI</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.flex1}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesContainer,
            { paddingBottom: Math.max(100, keyboardHeight > 0 ? 20 : 100) }
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyChat}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>Start a conversation by sending a message</Text>
            </View>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />
        
        <View style={[styles.inputWrapper, keyboardHeight > 0 && {
          marginBottom: keyboardHeight
        }]}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Type your message..."
              style={styles.input}
              value={input}
              onChangeText={setInput}
              editable={!sending}
              multiline
              maxLength={500}
              autoFocus={true}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]} 
              onPress={sendMessage}
              disabled={sending || !input.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendText}>Send</Text>
              )}
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
    backgroundColor: '#f5f5f5' 
  },
  flex1: {
    flex: 1,
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 16, 
    color: '#666', 
    fontSize: 16 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 40,
  },
  messagesContainer: { 
    padding: 16, 
    paddingBottom: 100
  },
  messageContainer: {
    marginBottom: 16,
  },
  msg: { 
    padding: 12, 
    borderRadius: 16, 
    maxWidth: '80%',
  },
  userMsg: { 
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    marginLeft: '20%'
  },
  otherMsg: { 
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    marginRight: '20%',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#000',
  },
  servicesOuterContainer: {
    marginTop: 8,
    marginHorizontal: 10,
    alignSelf: 'flex-start',
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c3e50',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  serviceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  input: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 24, 
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    maxHeight: 100,
  },
  sendBtn: { 
    backgroundColor: '#007AFF', 
    paddingHorizontal: 20,
    paddingVertical: 12, 
    borderRadius: 24, 
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  sendBtnDisabled: {
    backgroundColor: '#ccc'
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100
  },
  emptyChat: {
    textAlign: 'center',
    color: '#888',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 14
  }
});

export default QueryChatScreen;