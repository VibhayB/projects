import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../utils/config';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - (CARD_MARGIN * 3)) / 2;

const DEFAULT_PRODUCT_IMAGE = 'https://cdn3d.iconscout.com/3d/premium/thumb/product-3d-icon-png-download-4863042.png';

export default function SuppliesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [catId, setCatId] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [cartCount, setCartCount] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [wishlistIds, setWishlistIds] = useState([]);
  const searchInputRef = useRef(null);
  const searchTextRef = useRef('');

  const filteredItems = useMemo(() => {
    console.log('filteredItems computed:', { catId, appliedSearch });
    let filtered = items;
    
    if (catId) {
      filtered = filtered.filter(item => item.categoryId === catId);
    }
    
    if (appliedSearch.trim()) {
      const searchQuery = appliedSearch.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchQuery) ||
        item.description?.toLowerCase().includes(searchQuery)
      );
    }
    
    return filtered;
  }, [items, catId, appliedSearch]);

  const loadCartCount = useCallback(async () => {
    try {
      const cartStr = await AsyncStorage.getItem('cart');
      const cart = cartStr ? JSON.parse(cartStr) : [];
      setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0));
    } catch (error) {
      console.warn('Failed to load cart count:', error);
    }
  }, []);

  const loadWishlist = useCallback(async () => {
    try {
      const sessionId = await AsyncStorage.getItem('sessionId');
      if (!sessionId) return;

      const response = await fetch(`${config.BASE_URL}/wishlist/${sessionId}`);
      const data = await response.json();
      if (response.ok) {
        setWishlistIds(data.items?.map(item => item.id) || []);
      }
    } catch (error) {
      console.warn('Failed to load wishlist:', error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/supply-categories`, {
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Categories load error:', err);
      setError('Failed to load categories');
      setCategories([]);
    }
  }, []);

  const loadItems = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const url = `${config.BASE_URL}/supplies`;
      const response = await fetch(url, {
        timeout: 15000,
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);

    } catch (err) {
      console.error('Items load error:', err);
      setError(err.message || 'Failed to load supplies');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Load all data on initial mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        loadCategories(),
        loadItems(false),
        loadCartCount(),
        loadWishlist()
      ]);
      setLoading(false);
    };
    
    loadInitialData();
  }, [loadCategories, loadItems, loadCartCount, loadWishlist]);

  // Reload all data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('SuppliesScreen focused - reloading data...');
      Promise.all([
        loadCategories(),
        loadItems(false),
        loadCartCount(),
        loadWishlist()
      ]);
    });

    return unsubscribe;
  }, [navigation, loadCategories, loadItems, loadCartCount, loadWishlist]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCategories(), loadItems(false), loadCartCount(), loadWishlist()]);
    setRefreshing(false);
  }, [loadCategories, loadItems, loadCartCount, loadWishlist]);

  const handleSearchSubmit = useCallback(() => {
    const searchText = searchTextRef.current;
    console.log('Search submitted with:', searchText);
    setAppliedSearch(searchText);
  }, []);

  const toggleWishlist = useCallback(async (item, event) => {
    event.stopPropagation();
    
    try {
      const sessionId = await AsyncStorage.getItem('sessionId');
      if (!sessionId) {
        Alert.alert('Login Required', 'Please login to use wishlist');
        return;
      }

      const isInWishlist = wishlistIds.includes(item.id);
      const endpoint = isInWishlist ? 'remove-from-wishlist' : 'add-to-wishlist';

      const response = await fetch(`${config.BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, itemId: item.id })
      });

      if (response.ok) {
        if (isInWishlist) {
          setWishlistIds(prev => prev.filter(id => id !== item.id));
        } else {
          setWishlistIds(prev => [...prev, item.id]);
        }
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
    }
  }, [wishlistIds]);

  const quickAddToCart = useCallback(async (item, event) => {
    event.stopPropagation();
    
    const maxStock = item.stockQuantity || 100;
    
    try {
      const cartStr = await AsyncStorage.getItem('cart');
      const cart = cartStr ? JSON.parse(cartStr) : [];
      
      const existingIndex = cart.findIndex(cartItem => cartItem.id === item.id);
      
      let newQuantity = 1;
      if (existingIndex >= 0) {
        newQuantity = (cart[existingIndex].quantity || 1) + 1;
        
        if (newQuantity > maxStock) {
          Alert.alert('Stock Limit', `Maximum ${maxStock} available`);
          return;
        }
        
        cart[existingIndex].quantity = newQuantity;
      } else {
        cart.push({ ...item, quantity: 1 });
      }
      
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
      loadCartCount();
      
    } catch (error) {
      Alert.alert('Error', 'Failed to add to cart');
    }
  }, [loadCartCount]);

  const navigateToDetail = useCallback((item) => {
    navigation.navigate('SupplyDetail', { item });
  }, [navigation]);

  const getValidImageUri = useCallback((uri) => {
    if (!uri || typeof uri !== 'string' || uri.trim() === '') {
      return DEFAULT_PRODUCT_IMAGE;
    }
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      return DEFAULT_PRODUCT_IMAGE;
    }
    return uri;
  }, []);

  const handleImageError = useCallback((itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  }, []);

  const renderStars = useCallback((rating) => {
    const stars = [];
    const avgRating = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[styles.star, { color: i <= avgRating ? '#f39c12' : '#dee2e6' }]}>
          ★
        </Text>
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  }, []);

  const renderItem = useCallback(({ item }) => {
    const isGridMode = viewMode === 'grid';
    const cardStyle = isGridMode ? styles.gridCard : styles.listCard;
    const imageStyle = isGridMode ? styles.gridImage : styles.listImage;
    const isOutOfStock = !item.inStock || item.stockQuantity === 0;
    const imageUri = imageErrors[item.id] ? DEFAULT_PRODUCT_IMAGE : getValidImageUri(item.icon);
    const isInWishlist = wishlistIds.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[cardStyle, { width: isGridMode ? CARD_WIDTH : '100%' }]}
        onPress={() => navigateToDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageUri }} 
            style={[imageStyle, isOutOfStock && styles.outOfStockImage]}
            onError={() => handleImageError(item.id)}
          />
          
          <TouchableOpacity 
            style={styles.wishlistIcon}
            onPress={(e) => toggleWishlist(item, e)}
          >
            <Text style={[styles.heartIcon, { color: isInWishlist ? '#e74c3c' : '#fff' }]}>
              {isInWishlist ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>

          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>
        
        <View style={isGridMode ? styles.gridContent : styles.listContent}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          
          <View style={styles.ratingRow}>
            {renderStars(item.averageRating)}
            <Text style={styles.ratingCount}>
              ({item.totalReviews || 0})
            </Text>
          </View>

          <Text style={styles.itemPrice}>₹{item.price}</Text>
          
          {!isOutOfStock && (
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={(e) => quickAddToCart(item, e)}
            >
              <Text style={styles.quickAddText}>+ Cart</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [viewMode, navigateToDetail, quickAddToCart, imageErrors, wishlistIds]);
  const navigateToCart = async () => {
  try {
    const cartStr = await AsyncStorage.getItem('cart');
    let cartData = cartStr ? JSON.parse(cartStr) : [];
    
    const validatedCart = cartData.map(cartItem => {
      const currentItem = items.find(item => item.id === cartItem.id);
      return currentItem ? {
        ...cartItem,
        stockQuantity: currentItem.stockQuantity,
        inStock: currentItem.inStock,
        price: currentItem.price
      } : cartItem;
    }).filter(item => item.inStock); // Remove out-of-stock items

    navigation.navigate('Cart', { validatedCart });
  } catch (error) {
    console.error('Failed to validate cart:', error);
    navigation.navigate('Cart');
  }
};
  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.menuRow}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('OrderHistory')}
        >
          <Text style={styles.menuIcon}>📦</Text>
          <Text style={styles.menuButtonText}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Wishlist')}
        >
          <Text style={styles.menuIcon}>❤️</Text>
          <Text style={styles.menuButtonText}>Wishlist</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search supplies..."
          onChangeText={(text) => { searchTextRef.current = text; }}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={catId}
          onValueChange={(value) => {
            console.log('Category changed:', value);
            setCatId(value);
          }}
          style={styles.picker}
        >
          <Picker.Item label="All Categories" value="" />
          {categories.map(c => (
            <Picker.Item key={c.id} label={c.name} value={c.id} />
          ))}
        </Picker>
      </View>

      <View style={styles.controlsRow}>
        <Text style={styles.resultsCount}>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </Text>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>☰</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'grid' && styles.activeToggle]}
            onPress={() => setViewMode('grid')}
          >
            <Text style={[styles.toggleText, viewMode === 'grid' && styles.activeToggleText]}>⊞</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [categories, catId, filteredItems.length, viewMode, handleSearchSubmit, navigation]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8e44ad" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8e44ad']} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No items found</Text>
          </View>
        }
      />
      
      {cartCount > 0 && (
        <TouchableOpacity style={styles.cartButton} onPress={navigateToCart}>
          <Text style={styles.cartIcon}>🛒</Text>
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8 },
  menuRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  menuButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8e44ad', paddingVertical: 12, borderRadius: 12 },
  menuIcon: { fontSize: 18, marginRight: 8 },
  menuButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#e1e5e9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: '#f8f9fa' },
  searchButton: { backgroundColor: '#8e44ad', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, justifyContent: 'center' },
  searchButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pickerContainer: { borderWidth: 1, borderColor: '#e1e5e9', borderRadius: 12, backgroundColor: '#f8f9fa', marginBottom: 12 },
  picker: { height: 50 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultsCount: { fontSize: 14, color: '#6c757d', fontWeight: '500' },
  viewToggle: { flexDirection: 'row', borderWidth: 1, borderColor: '#e1e5e9', borderRadius: 8, overflow: 'hidden' },
  toggleButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff' },
  activeToggle: { backgroundColor: '#8e44ad' },
  toggleText: { fontSize: 16, color: '#6c757d' },
  activeToggleText: { color: '#fff' },
  listContainer: { paddingHorizontal: CARD_MARGIN, paddingBottom: 80 },
  gridCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: CARD_MARGIN, marginHorizontal: CARD_MARGIN / 2, elevation: 3 },
  gridImage: { width: '100%', height: 120, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  gridContent: { padding: 12 },
  listCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: CARD_MARGIN, padding: 12, elevation: 2 },
  listImage: { width: 80, height: 80, borderRadius: 8 },
  listContent: { flex: 1, marginLeft: 12 },
  imageContainer: { position: 'relative' },
  wishlistIcon: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  heartIcon: { fontSize: 18 },
  outOfStockImage: { opacity: 0.5 },
  outOfStockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(231, 76, 60, 0.65)', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  outOfStockText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  starsRow: { flexDirection: 'row', marginRight: 4 },
  star: { fontSize: 12 },
  ratingCount: { fontSize: 11, color: '#6c757d' },
  itemPrice: { fontSize: 18, fontWeight: 'bold', color: '#27ae60', marginBottom: 8 },
  quickAddButton: { backgroundColor: '#8e44ad', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start' },
  quickAddText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6c757d' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#2c3e50' },
  cartButton: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#8e44ad', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  cartIcon: { fontSize: 24 },
  cartBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#e74c3c', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 4 },
});