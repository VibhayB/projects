import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';

import config from '../utils/config';

const HomeScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${config.BASE_URL}/services`);
        const data = await response.json();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const onRefresh = async () => {
  setRefreshing(true);
  try {
    const response = await fetch(`${config.BASE_URL}/services`);
    const data = await response.json();
    setServices(data);
  } catch (error) {
    console.error('Error refreshing services:', error);
  } finally {
    setRefreshing(false);
  }
};


  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Services</Text>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() =>
              navigation.navigate('Providers', {
                serviceId: item.id,
                title: item.title,
              })
            }
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  serviceCard: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f2f2f2',
    marginBottom: 10,
    borderRadius: 8,
  },
  image: { width: 60, height: 60, marginRight: 10, borderRadius: 8 },
  title: { fontSize: 18, fontWeight: '600' },
  description: { fontSize: 14, color: '#555' },
});

export default HomeScreen;
