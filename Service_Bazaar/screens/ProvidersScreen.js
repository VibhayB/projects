import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import config from '../utils/config';

export default function ProvidersScreen({ route, navigation }) {
  const { serviceId, title } = route.params;

  const [coords, setCoords] = useState(null); 
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef();

  const fetchProviders = async (lat, lng) => {
    setLoading(true);
    try {
      const url = `${config.BASE_URL}/providers/${serviceId}?lat=${lat}&lng=${lng}`;
      const res = await fetch(url);
      const data = await res.json();
      setProviders(data);

      mapRef.current?.injectJavaScript(`renderPins(${JSON.stringify(
        data.map(p => ({
          id: p.id,
          name: p.name.replace(/'/g, "\\'"),
          lat: p.lat,
          lng: p.lng,
        }))
      )}); true;`);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onMapTap = (msg) => {
    try {
      const [lat, lng] = msg.nativeEvent.data.split(',');
      setCoords({ lat: parseFloat(lat), lng: parseFloat(lng) });
      fetchProviders(lat, lng);
    } catch (e) {
      console.log('Invalid tap coords:', e);
    }
  };

  const html = `
<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>html,body,#map{height:100%;margin:0;padding:0;}</style>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
</head>
<body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const map = L.map('map').setView([20.59,78.96], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap'
  }).addTo(map);

  map.on('click', e => {
    window.ReactNativeWebView.postMessage(e.latlng.lat + ',' + e.latlng.lng);
  });

  window.renderPins = (list) => {
    if (window.pinLayer) map.removeLayer(window.pinLayer);
    const group = L.layerGroup();
    list.forEach(p => {
      group.addLayer(L.marker([p.lat, p.lng]).bindPopup('<b>' + p.name + '</b>'));
    });
    window.pinLayer = group;
    map.addLayer(group);
    if (list.length) map.fitBounds(group.getBounds(), { padding: [40, 40] });
  };
</script></body></html>`;

  const ProviderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProviderDetail', { provider: item })}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text>⭐ {item.rating} ({item.totalRating})</Text>
        <Text>Jobs: {item.successfulServices}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Tap map to find nearby {title} providers</Text>

      <View style={styles.map}>
        <WebView
          ref={mapRef}
          originWhitelist={['*']}
          source={{ html }}
          onMessage={onMapTap}
          style={{ flex: 1 }}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ margin: 16 }} />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={item => item.id}
          renderItem={ProviderCard}
          ListHeaderComponent={
            coords && providers.length === 0
              ? <Text style={{ textAlign: 'center', marginTop: 10 }}>No providers found nearby.</Text>
              : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 12 },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 8,
  },
  map: {
    height: 260,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  image: { width: 60, height: 60, borderRadius: 30, marginRight: 10 },
  name: { fontSize: 16, fontWeight: '600' },
});
