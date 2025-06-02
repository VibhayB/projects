import React, { useRef, useState, useEffect } from 'react';

import {
  Animated, 
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Modal,
  ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

const IndianStates = [
  'Central', 'Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu Kashmir', 'Jharkhand', 'Karnataka', 
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Odisha', 
    'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 
    'West Bengal'
];

const ChatScreen = () => {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [query, setQuery] = useState('');
  const [state, setState] = useState(0); 
  const [showSidebar, setShowSidebar] = useState(false);
  const slideAnim = useRef(new Animated.Value(-240)).current;
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatIdToDelete, setChatIdToDelete] = useState(null);

  const currentMessages = chats.find(c => c.id === selectedChatId)?.messages || [];
  const flatListRef = useRef();
  useEffect(() => {
    if (showSidebar) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -240,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showSidebar]);
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [currentMessages]); 
  
  const handleSend = async () => {
    if (!query.trim()) return;
  
    const sendQueryToBackend = async (userQuery) => {
      try {
        const res = await fetch('http://192.168.xxx.xxx:5000/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userQuery,
            state,
          }),
        });
  
        const data = await res.json();
        return data.response || 'No response received.';  
      } catch (error) {
        return 'Failed to fetch response.';
      }
    };
  
    const newMessage = {
      id: Date.now().toString(),
      text: query,
      type: 'user',
    };
    
    const currentTime = Date.now().toString();
  const tempBotMessage = {
    id: currentTime + '-temp',
    text: 'Thinking...',
    type: 'bot',
  };
  let currentChatId = selectedChatId;
  if (!currentChatId) {
    currentChatId = Date.now().toString();
    
    const newChat = {
      id: currentChatId,
      name: query.length > 20 ? query.slice(0, 20) + '...' : query,
      messages: [newMessage, tempBotMessage],
    };
    
    setChats(prevChats => [newChat, ...prevChats]);
    setSelectedChatId(currentChatId);
  } else {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, newMessage, tempBotMessage] }
          : chat
      )
    );
  }

  setQuery('');

  const responseText = await sendQueryToBackend(query);

  const botMessage = {
    id: Date.now().toString(),
    text: responseText,
    type: 'bot',
  };

  // Replace "Thinking..." with the actual bot response
  setChats(prevChats =>
    prevChats.map(chat => {
      if (chat.id !== currentChatId) return chat;

      const updatedMessages = chat.messages.map(msg =>
        msg.id === tempBotMessage.id ? botMessage : msg
      );

      return { ...chat, messages: updatedMessages };
    })
  );
};
  
  

  const handleDeleteChat = (id) => {
    setChatIdToDelete(id);
    setShowDeleteModal(true); 
  };

  const confirmDelete = () => {
    setChats(prev => prev.filter(c => c.id !== chatIdToDelete));
    if (selectedChatId === chatIdToDelete) setSelectedChatId(null);
    setShowDeleteModal(false); 
  };

  const cancelDelete = () => {
    setShowDeleteModal(false); 
  };

  const handleRenameChat = (id, currentName) => {
    setRenamingId(id);
    setRenameText(currentName);
  };

  const confirmRename = () => {
    setChats(prev => prev.map(chat =>
      chat.id === renamingId ? { ...chat, name: renameText } : chat
    ));
    setRenamingId(null);
    setRenameText('');
  };

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      name: 'Unnamed Chat',
      messages: [],
    };

    setChats(prevChats => [newChat, ...prevChats]);

    setSelectedChatId(newChatId);
  };

  const renderMessage = ({ item }) => {
    const renderFormattedText = (text) => {
      const parts = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*)/g);
  
      let bulletCount = 0;
  
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text
              key={index}
              style={{
                fontWeight: 'bold',
                color: item.type === 'user' ? 'white' : 'black',
              }}
            >
              {part.slice(2, -2)}
            </Text>
          );
        } else if (part.startsWith('*') && part.endsWith('*')) {
          bulletCount++;
          if (bulletCount === 1) {
            // First bullet: treat as bullet point
            return (
              <Text
                key={index}
                style={{ color: item.type === 'user' ? 'white' : 'black' }}
              >
                {'\u2022'} {part.slice(1, -1)}{' '}
              </Text>
            );
          } else {
            // Second and later: bold
            return (
              <Text
                key={index}
                style={{
                  fontWeight: 'bold',
                  color: item.type === 'user' ? 'white' : 'black',
                }}
              >
                {part.slice(1, -1)}{' '}
              </Text>
            );
          }
        } else {
          return (
            <Text
              key={index}
              style={{ color: item.type === 'user' ? 'white' : 'black' }}
            >
              {part}
            </Text>
          );
        }
      });
    };
  
    return (
      <View
        style={[
          styles.messageBubble,
          item.type === 'user' ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.type === 'user' ? styles.userText : styles.botText,
          ]}
        >
          {renderFormattedText(item.text)}
        </Text>
      </View>
    );
  };
    
  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainLayout}>
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
  <View style={styles.sidebarTop}>
    <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
      <Text style={styles.newChatText}>+ New Chat</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => setShowSidebar(false)} style={styles.closeButton}>
      <Ionicons name="close" size={28} color="black" />
    </TouchableOpacity>
  </View>
  <ScrollView style={styles.chatList}>
    {chats.map(chat => (
      <TouchableOpacity
        key={chat.id}
        style={[styles.chatItem, selectedChatId === chat.id && styles.chatItemActive]}
        onPress={() => setSelectedChatId(chat.id)}
        onLongPress={() => handleRenameChat(chat.id, chat.name)}
      >
        <Text numberOfLines={1} style={styles.chatItemText}>{chat.name}</Text>
        <View style={styles.chatItemActions}>
          <TouchableOpacity onPress={() => handleRenameChat(chat.id, chat.name)}>
            <Ionicons name="pencil" size={18} color="rgba(0,0,0,0.4)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteChat(chat.id)}>
            <Ionicons name="trash" size={18} color="#ff3333" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ))}
  </ScrollView>
</Animated.View>


        <View style={styles.chatContainer}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => setShowSidebar(!showSidebar)}>
              <Ionicons name="menu" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>YojnaConnect</Text>
          </View>

          <FlatList
            ref={flatListRef} 
            data={currentMessages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatArea}
          />

          <View style={styles.pickerRow}>

            <Picker
              selectedValue={state}
              onValueChange={(itemValue, itemIndex) => setState(itemIndex)}
              style={styles.picker}
            >
              {IndianStates.map((stateName, index) => (
                <Picker.Item key={index} label={stateName} value={index} />
              ))}
            </Picker>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              placeholder="Send a query..."
              value={query}
              onChangeText={setQuery}
              style={styles.input}
              multiline
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={!!renamingId} transparent animationType="fade">
        <View style={styles.renameModalOverlay}>
          <View style={styles.renameModal}>
            <Text style={{ fontWeight: 'bold' , fontSize: 18}}>Rename Chat</Text>
            <TextInput
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Chat Name"
              style={styles.renameInput}
            />
            <View style={styles.renameActions}>
              <TouchableOpacity onPress={() => setRenamingId(null)} ><Text style={styles.nullbutton}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={confirmRename} ><Text style={styles.savebutton}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDeleteModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Delete Chat</Text>
      <Text style={styles.modalMessage}>Are you sure you want to delete this chat?</Text>
      <View style={styles.modalActions}>
        <TouchableOpacity onPress={cancelDelete}>
          <Text style={styles.nullbutton}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete}>
          <Text style={styles.canbutton}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    </SafeAreaView>
  );
};

export default ChatScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
  },
  mainLayout: {
    flexDirection: 'row',
    flex: 1,
  },
  sidebar: {
    width: 240,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderColor: '#ddd',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  sidebarTop: {
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
  },
  newChatButton: {
    backgroundColor: '#4799b8',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: 'green',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  newChatText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  chatItemActive: {
    backgroundColor: '#e6f0ff',
  },
  chatItemText: {
    flex: 1,
    marginRight: 10,
    fontSize: 15,
    color: '#333',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  }, chatItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 50,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#333',
  },
  chatArea: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    marginVertical: 6,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#89af13',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  userText: {
    color: '#fff',
    fontSize: 16,
  },
  botBubble: {
    backgroundColor: '#e9e9eb',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
  },
  botText: {
    color: '#111',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginVertical: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  selectedValue: {
    fontSize: 16,
    lineHeight: 24,
  },
  picker: {
    flex: 1,
    height: 54,
    marginHorizontal: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  input: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#89af13',
    borderRadius: 22,
    padding: 12,
    marginLeft: 8,
  },
  renameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renameModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '85%',
    elevation: 8,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },savebutton: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },canbutton: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },nullbutton: {
    color: 'gray',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  }, modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: 300,
  },
  modalMessage: {
    fontSize: 16,
    marginVertical: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
