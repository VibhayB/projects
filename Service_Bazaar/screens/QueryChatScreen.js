import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import config from '../utils/config';

const QueryChatScreen = ({ route }) => {
  const { newChat } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [threadId, setThreadId] = useState(route.params?.threadId || null);

  useEffect(() => {
    (async () => {
      const sid = await AsyncStorage.getItem('sessionId');
      setSessionId(sid);

      if (!newChat && threadId) {
        const res = await fetch(`${config.BASE_URL}/query-thread/${threadId}`);
        const thread = await res.json();
        setMessages(thread.messages || []);
      }
    })();
  }, [threadId]);

  const sendMessage = async () => {
  if (!input.trim()) return;

  let activeThreadId = threadId;

  if (newChat && !activeThreadId) {
    const threadRes = await fetch(`${config.BASE_URL}/create-query-thread`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    const threadData = await threadRes.json();
    if (threadData.threadId) {
      activeThreadId = threadData.threadId;
      setThreadId(activeThreadId);
    } else {
      console.error('Failed to create thread');
      return;
    }
  }

  const payload = { sessionId, text: input, threadId: activeThreadId };
  const res = await fetch(`${config.BASE_URL}/send-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  const newMessages = [
    { text: input, sender: 'user' },
  ];

  if (data.reply) {
    newMessages.push({
      text: data.reply,
      sender: 'ai',
      recommendedServiceId: data.recommendedServiceId || null,
    });
  }

  setMessages(m => [...m, ...newMessages]);
  setInput('');
};


  const renderItem = ({ item }) => (
    <SafeAreaView style={[styles.msg, item.sender === 'user' ? styles.userMsg : styles.otherMsg]}>
      <Text>{item.text}</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ padding: 16 }}
      />
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Type your message..."
          style={styles.input}
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={{ color: '#fff' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  msg: { padding: 10, marginVertical: 4, borderRadius: 6, maxWidth: '75%' },
  userMsg: { backgroundColor: '#d1f0d1', alignSelf: 'flex-end' },
  otherMsg: { backgroundColor: '#f0f0f0', alignSelf: 'flex-start' },
  inputRow: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#ccc' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginRight: 10 },
  sendBtn: { backgroundColor: '#3498db', padding: 12, borderRadius: 6, justifyContent: 'center' },
});

export default QueryChatScreen;
