import React, { useEffect, useState } from 'react';
import {
  View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet
} from 'react-native';
import config from '../utils/config';
import { SafeAreaView } from 'react-native-safe-area-context';
const BookingChatScreen = ({ route }) => {
  const { bookingId, sender } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');

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
    if (!newMsg.trim()) return;
    try {
      await fetch(`${config.BASE_URL}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, sender, text: newMsg }),
      });
      setNewMsg('');
      fetchChat(); // re-fetch after send
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  useEffect(() => {
    fetchChat();
    const timer = setInterval(fetchChat, 4000); // poll every 4s
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Text
            style={{
              padding: 10,
              backgroundColor: item.sender === sender ? '#dff9fb' : '#f6e58d',
              alignSelf: item.sender === sender ? 'flex-end' : 'flex-start',
              margin: 6,
              borderRadius: 10,
              maxWidth: '75%',
            }}
          >
            {item.text}
          </Text>
        )}
        contentContainerStyle={{ padding: 10 }}
      />
      <View style={styles.inputRow}>
        <TextInput
          value={newMsg}
          onChangeText={setNewMsg}
          placeholder="Type a message..."
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMsg} style={styles.sendBtn}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  sendBtn: {
    backgroundColor: '#27ae60',
    marginLeft: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderRadius: 6,
  },
});

export default BookingChatScreen;
