import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const DEFAULT_PRODUCT_IMAGE = 'https://cdn3d.iconscout.com/3d/premium/thumb/product-3d-icon-png-download-4863042.png';

export default function CartScreen({ navigation, route }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});

  // Load cart when screen focuses or receives updated data
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCart();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route.params?.validatedCart) {
      console.log('Received validated cart from SupplyScreen');
      setCart(route.params.validatedCart);
      setLoading(false);
      
      AsyncStorage.setItem('cart', JSON.stringify(route.params.validatedCart));
    }
  }, [route.params?.validatedCart]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartStr = await AsyncStorage.getItem('cart');
      const cartData = cartStr ? JSON.parse(cartStr) : [];
      setCart(cartData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load cart');
      console.error('Load cart error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCart = async (newCart) => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch (error) {
      Alert.alert('Error', 'Failed to update cart');
      console.error('Update cart error:', error);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    const newCart = cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    updateCart(newCart);
  };

  const removeItem = (itemId) => {
    Alert.alert(
      'Remove Item',
      'Remove this item from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newCart = cart.filter(item => item.id !== itemId);
            updateCart(newCart);
          }
        }
      ]
    );
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    
    Alert.alert(
      'Clear Cart',
      'Remove all items from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => updateCart([])
        }
      ]
    );
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

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateItemTotal = (item) => {
    return (item.price * item.quantity).toFixed(2);
  };

  const handleCheckout = () => {
    navigation.navigate('Checkout', { 
      cartItems: cart,
    });
  };

  const renderItem = ({ item, index }) => {
    const imageUri = imageErrors[item.id] ? DEFAULT_PRODUCT_IMAGE : getValidImageUri(item.icon);
    const maxStock = item.stockQuantity || 0;
    const isOutOfStock = !item.inStock || maxStock === 0;

    return (
      <View style={styles.cartItem}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.itemImage}
            onError={() => handleImageError(item.id)}
          />
        </View>
        
        <View style={styles.itemDetails}>
          <View style={styles.topRow}>
            <View style={styles.nameSection}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <View style={[
                styles.stockIndicator,
                isOutOfStock ? styles.outOfStock : 
                maxStock <= 5 ? styles.lowStock : styles.inStock
              ]}>
                <View style={styles.stockDot} />
                <Text style={styles.stockText}>
                  {isOutOfStock ? 'Out of stock' : 
                   maxStock <= 5 ? `Only ${maxStock} left` : 'In stock'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeItem(item.id)}
            >
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                
                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.quantityButton, isOutOfStock && styles.quantityButtonDisabled]}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={isOutOfStock}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>Price:</Text>
              <Text style={styles.itemTotal}>₹{calculateItemTotal(item)}</Text>
              <Text style={styles.unitPrice}>₹{item.price} each</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
          <Text style={styles.loadingText}>Loading your cart...</Text>
          <Text style={styles.loadingSubtext}>Please wait a moment</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Your Cart</Text>
            <Text style={styles.headerSubtitle}>{cart.length} items</Text>
          </View>
          {cart.length > 0 && (
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={clearCart}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>🛒</Text>
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyMessage}>
            Add items to get started with your shopping
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.shopButtonText}>← Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.subtotalAmount}>₹{calculateTotal().toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Shipping</Text>
                <Text style={styles.shippingText}>Free</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <View style={styles.totalAmountContainer}>
                  <Text style={styles.totalAmount}>₹{calculateTotal().toFixed(2)}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutIcon}>🛍️</Text>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.continueShopping}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.continueShoppingText}>← Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#475569',
    fontWeight: '600',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  clearAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
  },
  clearAllText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 180, // Space for footer
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  nameSection: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 22,
    marginBottom: 8,
  },
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inStock: {
    backgroundColor: '#f0fdf4',
  },
  inStockText: {
    color: '#16a34a',
  },
  lowStock: {
    backgroundColor: '#fef3c7',
  },
  lowStockText: {
    color: '#d97706',
  },
  outOfStock: {
    backgroundColor: '#fef2f2',
  },
  outOfStockText: {
    color: '#dc2626',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 18,
    color: '#dc2626',
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantitySection: {
    flex: 1,
  },
  quantityLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 4,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    backgroundColor: '#7c3aed',
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  quantityButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowColor: 'transparent',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  priceSection: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  priceLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  unitPrice: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalContainer: {
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
  },
  subtotalAmount: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  shippingText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#16a34a',
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  totalAmountContainer: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#7c3aed',
  },
  taxNote: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  checkoutButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  checkoutIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  continueShopping: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  continueShoppingText: {
    color: '#7c3aed',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f8fafc',
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});