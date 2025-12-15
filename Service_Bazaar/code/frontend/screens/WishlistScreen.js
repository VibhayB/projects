import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../utils/config';

const DEFAULT_PRODUCT_IMAGE = 'https://cdn3d.iconscout.com/3d/premium/thumb/product-3d-icon-png-download-4863042.png';

export default function WishlistScreen({ navigation }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    loadWishlist();
    const unsubscribe = navigation.addListener('focus', loadWishlist);
    return unsubscribe;
  }, [navigation]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const sessionId = await AsyncStorage.getItem('sessionId');

      if (!sessionId) {
        Alert.alert('Authentication Required', 'Please login to view wishlist');
        navigation.goBack();
        return;
      }

      const response = await fetch(
        `${config.BASE_URL}/wishlist/${sessionId}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (response.ok) {
        setWishlist(data.items || []);
      } else {
        throw new Error(data.error || 'Failed to load wishlist');
      }
    } catch (error) {
      console.error('Load wishlist error:', error);
      Alert.alert('Error', 'Failed to load wishlist');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const removeFromWishlist = async (itemId) => {
    Alert.alert(
      'Remove from Wishlist',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const sessionId = await AsyncStorage.getItem('sessionId');

              const response = await fetch(
                `${config.BASE_URL}/remove-from-wishlist`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sessionId, itemId })
                }
              );

              const data = await response.json();

              if (response.ok) {
                setWishlist(prev => prev.filter(item => item.id !== itemId));
              } else {
                throw new Error(data.error || 'Failed to remove item');
              }
            } catch (error) {
              console.error('Remove from wishlist error:', error);
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWishlist();
  };

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const getValidImageUri = (uri) => {
    if (!uri || typeof uri !== 'string' || uri.trim() === '') {
      return DEFAULT_PRODUCT_IMAGE;
    }
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      return DEFAULT_PRODUCT_IMAGE;
    }
    return uri;
  };

  const renderItem = ({ item }) => {
    const imageUri = imageErrors[item.id] 
      ? DEFAULT_PRODUCT_IMAGE 
      : getValidImageUri(item.icon);
    const isOutOfStock = !item.inStock || item.stockQuantity === 0;

    return (
      <TouchableOpacity
        style={styles.wishlistItem}
        onPress={() => navigation.navigate('SupplyDetail', { item })}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.itemImage}
          onError={() => handleImageError(item.id)}
        />

        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>★</Text>
            <Text style={styles.ratingValue}>
              {item.averageRating?.toFixed(1) || '0.0'}
            </Text>
            <Text style={styles.reviewCount}>
              ({item.totalReviews || 0})
            </Text>
          </View>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          {isOutOfStock && (
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromWishlist(item.id)}
        >
          <Text style={styles.removeIcon}>♥</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8e44ad" />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <Text style={styles.itemCount}>{wishlist.length} items</Text>
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>♡</Text>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptyMessage}>
            Add items you love to save them for later
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#8e44ad']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  itemCount: {
    fontSize: 14,
    color: '#6c757d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  listContainer: {
    padding: 16,
  },
  wishlistItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#f39c12',
    marginRight: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6c757d',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  outOfStockText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
    justifyContent: 'center',
  },
  removeIcon: {
    fontSize: 28,
    color: '#e74c3c',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    color: '#dee2e6',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#8e44ad',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});