import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, Image,
  TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import config            from '../utils/config';

export default function SuppliesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [catId,      setCatId]      = useState('');
  const [query,      setQuery]      = useState('');
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* load categories once */
  useEffect(() => {
    (async () => {
      const r = await fetch(`${config.BASE_URL}/supply-categories`);
      setCategories(await r.json());
    })();
  }, []);

  /* load items whenever filter changes */
  const loadItems = useCallback(async () => {
    setLoading(true);
    const url = `${config.BASE_URL}/supplies?cat=${catId}&q=${encodeURIComponent(query)}`;
    const r   = await fetch(url);
    setItems(await r.json());
    setLoading(false);
  }, [catId, query]);

  /* on mount & on filter change */
  useEffect(() => { loadItems(); }, [loadItems]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('SupplyDetail', { item })}
    >
      <Image source={{ uri: item.icon }} style={styles.img} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text>₹ {item.price}</Text>
      </View>
    </TouchableOpacity>
  );
const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadItems(); // reloads data
  setRefreshing(false);
}, [loadItems]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search supplies..."
        value={query}
        onChangeText={setQuery}
      />

      <Picker
        selectedValue={catId}
        onValueChange={v => setCatId(v)}
        style={{ marginBottom: 8 }}
      >
        <Picker.Item label="All Categories" value="" />
        {categories.map(c => (
          <Picker.Item key={c.id} label={c.name} value={c.id} />
        ))}
      </Picker>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:16 },
  search:{ borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:8, marginBottom:8 },
  card:{ flexDirection:'row', backgroundColor:'#f0f0f0', padding:10,
         borderRadius:8, marginBottom:10, alignItems:'center' },
  img:{ width:50, height:50, marginRight:10, borderRadius:6 },
  name:{ fontWeight:'600' }
});
