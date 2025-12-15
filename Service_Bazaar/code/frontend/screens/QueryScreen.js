import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Alert, Modal, TouchableWithoutFeedback, Animated, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../utils/config';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function QueryScreen({ navigation }) {
  const [threads, setThreads] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState({ visible: false, threadId: null, position: { x: 0, y: 0 } });
  const fadeAnim = useState(new Animated.Value(0))[0];
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const fetchThreads = useCallback(async (sid) => {
    if (!sid) return;

    try {
      console.log('Fetching threads for session:', sid);
      const res = await fetch(`${config.BASE_URL}/query-threads/${sid}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Threads data received:', data);
      
      const threadsWithKeys = (data.threads || []).map((thread, index) => ({
        ...thread,
        threadId: thread.id,
        uniqueKey: `${thread.id}-${index}`,
        createdAt: thread.createdAt || new Date().toISOString(),
      }));

      const groupedThreads = groupThreadsByDate(threadsWithKeys);
      setThreads(groupedThreads);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteThread = useCallback(async (threadId) => {
    if (!sessionId) {
      Alert.alert('Error', 'Session ID not found');
      return;
    }

    try {
      const res = await fetch(`${config.BASE_URL}/query-thread/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }

      console.log('Thread deleted:', data);
      Alert.alert('Success', 'Thread deleted successfully');
      await fetchThreads(sessionId);
    } catch (err) {
      console.error('Error deleting thread:', err);
      Alert.alert('Error', err.message || 'Failed to delete thread');
    }
    setContextMenu({ visible: false, threadId: null, position: { x: 0, y: 0 } });
  }, [sessionId, fetchThreads]);

  const groupThreadsByDate = (threads) => {
    const grouped = {};

    threads.forEach(thread => {
      const date = new Date(thread.createdAt);
      const today = new Date();
      let sectionTitle;

      if (date.toDateString() === today.toDateString()) {
        sectionTitle = 'Today';
      } else if (
        date.toDateString() === new Date(today.setDate(today.getDate() - 1)).toDateString()
      ) {
        sectionTitle = 'Yesterday';
      } else {
        sectionTitle = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }

      if (!grouped[sectionTitle]) {
        grouped[sectionTitle] = [];
      }
      grouped[sectionTitle].push(thread);
    });

    return Object.keys(grouped).map(title => ({
      title,
      data: grouped[title],
    }));
  };

  useEffect(() => {
    (async () => {
      const sid = await AsyncStorage.getItem('sessionId');
      console.log('Session ID from storage:', sid);
      setSessionId(sid);
      if (sid) {
        fetchThreads(sid);
      } else {
        setLoading(false);
      }
    })();
  }, [fetchThreads]);

  const onRefresh = async () => {
    if (!sessionId) return;
    setRefreshing(true);
    await fetchThreads(sessionId);
    setRefreshing(false);
  };

  const openContextMenu = (threadId, event) => {
    const { pageX, pageY } = event.nativeEvent;
    console.log('Opening context menu at:', { pageX, pageY });
    setContextMenu({ visible: true, threadId, position: { x: pageX, y: pageY } });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeContextMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setContextMenu({ visible: false, threadId: null, position: { x: 0, y: 0 } });
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading your queries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={threads}
        keyExtractor={(item) => item.uniqueKey}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.thread}
            onPress={() => {
              console.log('Navigating to thread:', item.threadId);
              navigation.navigate('QueryChat', { 
                threadId: item.id,
                newChat: false
              });
            }}
          >
            <View style={styles.threadContainer}>
              <View style={styles.threadContent}>
                <Text style={styles.title}>{item.title || 'Untitled Query'}</Text>
                <Text numberOfLines={1} style={styles.preview}>
                  {item.lastMessage || 'No messages yet'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.moreBtn}
                onPress={(event) => openContextMenu(item.id, event)}
                onLayout={(event) => {
                  const { x, y, width, height } = event.nativeEvent.layout;
                  console.log('More button layout:', { x, y, width, height });
                }}
              >
                <Icon name="more-vert" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ListHeaderComponent={<Text style={styles.header}>Your Queries</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>No queries yet</Text>
            <Text style={styles.emptySubtitle}>Create your first query to get started</Text>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
          />
        }
      />

      <Modal
        transparent
        visible={contextMenu.visible}
        animationType="none"
        onRequestClose={closeContextMenu}
      >
        <TouchableWithoutFeedback onPress={closeContextMenu}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.contextMenu,
                {
                  top: Math.min(contextMenu.position.y + 20, screenHeight - 120), // Below three dots
                  left: Math.max(Math.min(contextMenu.position.x - 140, screenWidth - 160), 10), // Align left, ensure within bounds
                  opacity: fadeAnim,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.contextMenuItem, styles.deleteButton]}
                onPress={() => {
                  Alert.alert(
                    'Confirm Delete',
                    'Are you sure you want to delete this thread?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => deleteThread(contextMenu.threadId),
                      },
                    ]
                  );
                }}
              >
                <Icon name="delete" size={20} color="#fff" style={styles.contextMenuIcon} />
                <Text style={[styles.contextMenuText, { color: '#fff' }]}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contextMenuItem}
                onPress={closeContextMenu}
              >
                <Icon name="cancel" size={20} color="#333" style={styles.contextMenuIcon} />
                <Text style={styles.contextMenuText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <TouchableOpacity
        style={styles.newBtn}
        onPress={() => {
          console.log('Creating new chat');
          navigation.navigate('QueryChat', { newChat: true });
        }}
      >
        <Text style={styles.newTxt}>+ New Query</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginVertical: 16,
    color: '#333'
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  thread: { 
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  threadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  threadContent: {
    flex: 1
  },
  title: { 
    fontSize: 18, 
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4
  },
  preview: { 
    color: '#7f8c8d', 
    fontSize: 14
  },
  moreBtn: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  contextMenu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    width: 160,
    padding: 8,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  contextMenuIcon: {
    marginRight: 8,
  },
  contextMenuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  newBtn: { 
    backgroundColor: '#3498db', 
    padding: 16, 
    borderRadius: 12,
    alignItems: 'center', 
    marginTop: 16
  },
  newTxt: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40
  },
  empty: { 
    textAlign: 'center', 
    color: '#95a5a6',
    fontSize: 16,
    marginBottom: 8
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#bdc3c7',
    fontSize: 14
  }
});