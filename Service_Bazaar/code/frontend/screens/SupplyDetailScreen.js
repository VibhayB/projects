import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, TextInput, 
  Alert, ActivityIndicator, ScrollView, Dimensions,
  Share, Modal, FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import config from '../utils/config';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const DEFAULT_PRODUCT_IMAGE = 'https://cdn3d.iconscout.com/3d/premium/thumb/product-3d-icon-png-download-4863042.png';

export default function SupplyDetail({ route, navigation }) {
  const { item } = route.params;
  const [qty, setQty] = useState('1');
  const [loading, setLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [itemInCart, setItemInCart] = useState(false);
  const [cartItemQty, setCartItemQty] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);

  const maxStock = item.stockQuantity || 100;
  const isOutOfStock = !item.inStock || item.stockQuantity === 0;

  useEffect(() => {
    loadUserSession();
    checkCartStatus();
    loadRatings();
  }, []);

  const loadUserSession = async () => {
    try {
      const sessionId = await AsyncStorage.getItem('sessionId');
      setUserSession(sessionId);
    } catch (error) {
      console.warn('Failed to load session:', error);
    }
  };

  const checkCartStatus = async () => {
    try {
      const cartStr = await AsyncStorage.getItem('cart');
      const cart = cartStr ? JSON.parse(cartStr) : [];
      const existingItem = cart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        setItemInCart(true);
        setCartItemQty(existingItem.quantity || 1);
      } else {
        setItemInCart(false);
        setCartItemQty(0);
      }
    } catch (error) {
      console.warn('Failed to check cart status:', error);
    }
  };

  const loadRatings = async () => {
    try {
      setLoadingRatings(true);
      const response = await fetch(`${config.BASE_URL}/product-ratings/${item.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setRatings(data.ratings || []);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalReviews || 0);
      }
    } catch (error) {
      console.warn('Failed to load ratings:', error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const validateQty = useCallback(() => {
    const quantity = parseInt(qty, 10);
    
    if (isNaN(quantity) || quantity < 1) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity (minimum 1)');
      setQty('1');
      return 1;
    }
    
    if (quantity > maxStock) {
      Alert.alert(
        'Insufficient Stock', 
        `Only ${maxStock} items available in stock. Please adjust quantity.`
      );
      setQty(maxStock.toString());
      return maxStock;
    }
    
    const totalRequested = quantity + cartItemQty;
    if (totalRequested > maxStock) {
      const available = maxStock - cartItemQty;
      if (available <= 0) {
        Alert.alert(
          'Already in Cart',
          `You already have ${cartItemQty} in cart. Maximum stock is ${maxStock}.`
        );
        return 0;
      }
      Alert.alert(
        'Stock Limit',
        `You have ${cartItemQty} in cart. You can only add ${available} more.`
      );
      setQty(available.toString());
      return available;
    }
    
    return quantity;
  }, [qty, maxStock, cartItemQty]);

  const addToCart = async () => {
    if (isOutOfStock) {
      Alert.alert('Out of Stock', 'This item is currently unavailable.');
      return;
    }

    const quantity = validateQty();
    if (quantity === 0) return;

    try {
      const cartStr = await AsyncStorage.getItem('cart');
      const cart = cartStr ? JSON.parse(cartStr) : [];
      
      const existingIndex = cart.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingIndex >= 0) {
        const newQty = cart[existingIndex].quantity + quantity;
        if (newQty > maxStock) {
          Alert.alert(
            'Stock Limit Exceeded',
            `Cannot add ${quantity} more. Maximum stock is ${maxStock}, you already have ${cart[existingIndex].quantity} in cart.`
          );
          return;
        }
        cart[existingIndex].quantity = newQty;
        Alert.alert('Updated Cart', `${item.name} quantity updated to ${newQty}`);
      } else {
        cart.push({ ...item, quantity, addedAt: new Date().toISOString() });
        Alert.alert('Added to Cart', `${item.name} (Qty: ${quantity}) added to cart`);
      }
      
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
      setQty('1'); // Reset to 1
      checkCartStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
      console.error('Add to cart error:', error);
    }
  };

  const sendOrder = async (paymentMode, razorId = null) => {
    if (!userSession) {
      Alert.alert('Authentication Required', 'Please login to place orders');
      return;
    }

    if (isOutOfStock) {
      Alert.alert('Out of Stock', 'This item is currently unavailable.');
      return;
    }

    const quantity = validateQty();
    if (quantity === 0) return;
    
    try {
      setLoading(true);
      setPaymentModalVisible(false);
      
      const orderData = {
        sessionId: userSession,
        itemId: item.id,
        quantity,
        paymentMode,
        razorpayPaymentId: razorId,
        orderTimestamp: new Date().toISOString()
      };

      const response = await fetch(`${config.BASE_URL}/order-supply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData),
        timeout: 15000
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setQty('1'); // Reset to 1
        Alert.alert(
          'Order Successful!', 
          `Your order for ${item.name} has been placed successfully.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(result.error || 'Order placement failed');
      }
    } catch (error) {
      console.error('Order error:', error);
      Alert.alert(
        'Order Failed', 
        error.message || 'Failed to place order. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const buyCash = () => {
    if (isOutOfStock) {
      Alert.alert('Out of Stock', 'This item is currently unavailable.');
      return;
    }

    const quantity = validateQty();
    if (quantity === 0) return;

    Alert.alert(
      'Confirm Cash Payment',
      `Order total: ₹${(item.price * quantity).toFixed(2)}\nPayment will be collected after service delivery.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Order', onPress: () => sendOrder('cash') }
      ]
    );
  };

  const buyRazor = async () => {
    if (isOutOfStock) {
      Alert.alert('Out of Stock', 'This item is currently unavailable.');
      return;
    }

    const quantity = validateQty();
    if (quantity === 0) return;

    try {
      setLoading(true);
      setPaymentModalVisible(false);
      const totalAmount = item.price * quantity;
      
      const options = {
        description: `Purchase: ${item.name}`,
        currency: 'INR',
        key: '<YOUR_RAZORPAY_KEY>',
        amount: totalAmount * 100,
        name: item.name,
        image: getValidImageUri(item.icon),
        prefill: {
          email: '',
          contact: '',
        },
        theme: {
          color: '#8e44ad'
        }
      };

      const paymentResult = await RazorpayCheckout.open(options);
      await sendOrder('razorpay', paymentResult.razorpay_payment_id);
      
    } catch (error) {
      if (error?.description !== 'Payment cancelled' && error?.code !== 0) {
        Alert.alert('Payment Error', 'Payment failed. Please try again.');
        console.error('Razorpay error:', error);
      }
      setLoading(false);
    }
  };

  const shareItem = async () => {
    try {
      await Share.share({
        message: `Check out this item: ${item.name}\nPrice: ₹${item.price}\n${item.description || ''}`,
        title: item.name,
      });
    } catch (error) {
      console.warn('Share failed:', error);
    }
  };

  const adjustQuantity = (change) => {
    const currentQty = parseInt(qty, 10) || 1;
    const newQty = Math.max(1, Math.min(maxStock, currentQty + change));
    setQty(newQty.toString());
  };

  const getValidImageUri = (uri) => {
    if (!uri || typeof uri !== 'string' || uri.trim() === '') {
      return DEFAULT_PRODUCT_IMAGE;
    }
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      return DEFAULT_PRODUCT_IMAGE;
    }
    return imageError ? DEFAULT_PRODUCT_IMAGE : uri;
  };

  const renderStars = (rating) => {
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
  };

  const renderReviewItem = ({ item: review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>{review.userName || 'Anonymous'}</Text>
        {renderStars(review.rating)}
      </View>
      {review.review && review.review.trim() !== '' && (
        <Text style={styles.reviewText}>{review.review}</Text>
      )}
      <Text style={styles.reviewDate}>
        {new Date(review.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => setImageModalVisible(true)}
          activeOpacity={0.9}
        >
          <Image 
            source={{ uri: getValidImageUri(item.icon) }} 
            style={styles.mainImage}
            onError={() => setImageError(true)}
          />
          <View style={styles.imageOverlay}>
            <TouchableOpacity style={styles.shareButton} onPress={shareItem}>
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>₹{item.price}</Text>
          </View>

          {item.description && (
            <Text style={styles.itemDescription}>{item.description}</Text>
          )}

          <View style={styles.ratingSection}>
            <View style={styles.ratingRow}>
              {renderStars(averageRating)}
              <Text style={styles.ratingText}>
                {averageRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
              </Text>
            </View>
          </View>
          
          {isOutOfStock && (
            <View style={styles.outOfStockBanner}>
              <Text style={styles.outOfStockBannerText}>⚠️ OUT OF STOCK</Text>
            </View>
          )}
          
          {!isOutOfStock && maxStock <= 10 && (
            <View style={styles.lowStockBanner}>
              <Text style={styles.lowStockBannerText}>
                ⚡ Only {maxStock} left in stock!
              </Text>
            </View>
          )}

          {itemInCart && (
            <View style={styles.cartStatus}>
              <Text style={styles.cartStatusText}>
                ✓ Already in cart (Qty: {cartItemQty})
              </Text>
            </View>
          )}

          {!isOutOfStock && (
            <>
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>
                  Quantity (Max: {maxStock}):
                </Text>
                <View style={styles.quantitySelector}>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => adjustQuantity(-1)}
                    disabled={parseInt(qty) <= 1}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </TouchableOpacity>
                  
                  <TextInput
                    style={styles.quantityInput}
                    keyboardType="numeric"
                    value={qty}
                    onChangeText={setQty}
                    onBlur={validateQty}
                    maxLength={3}
                    textAlign="center"
                  />
                  
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => adjustQuantity(1)}
                    disabled={parseInt(qty) >= maxStock}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total: </Text>
                <Text style={styles.totalPrice}>
                  ₹{(item.price * (parseInt(qty, 10) || 1)).toFixed(2)}
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.cartButton]} 
                  onPress={addToCart}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {itemInCart ? '+ Add More to Cart' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, styles.buyButton]} 
                  onPress={() => setPaymentModalVisible(true)}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Buy Now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {isOutOfStock && (
            <View style={styles.outOfStockContainer}>
              <Text style={styles.outOfStockMessage}>
                This item is currently unavailable. Please check back later.
              </Text>
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <TouchableOpacity 
              style={styles.reviewsHeader}
              onPress={() => setReviewsExpanded(!reviewsExpanded)}
            >
              <Text style={styles.reviewsTitle}>
                Customer Reviews ({totalReviews})
              </Text>
              <Text style={styles.expandIcon}>
                {reviewsExpanded ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {reviewsExpanded && (
              <View style={styles.reviewsList}>
                {loadingRatings ? (
                  <ActivityIndicator size="small" color="#8e44ad" />
                ) : ratings.length > 0 ? (
                  <FlatList
                    data={ratings}
                    renderItem={renderReviewItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                ) : (
                  <Text style={styles.noReviewsText}>No reviews yet</Text>
                )}
              </View>
            )}
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8e44ad" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground}
            onPress={() => setImageModalVisible(false)}
          >
            <Image 
              source={{ uri: getValidImageUri(item.icon) }}
              style={styles.modalImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Text style={styles.modalCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.paymentModalContainer}>
          <View style={styles.paymentModalContent}>
            <Text style={styles.paymentModalTitle}>Choose Payment Method</Text>
            
            <TouchableOpacity 
              style={styles.paymentOption}
              onPress={buyCash}
            >
              <Text style={styles.paymentOptionIcon}>💵</Text>
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Cash After Service</Text>
                <Text style={styles.paymentOptionDesc}>Pay when service is delivered</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.paymentOption}
              onPress={buyRazor}
            >
              <Text style={styles.paymentOptionIcon}>💳</Text>
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Pay Now (Razorpay)</Text>
                <Text style={styles.paymentOptionDesc}>Pay securely with Razorpay</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.paymentModalCancel}
              onPress={() => setPaymentModalVisible(false)}
            >
              <Text style={styles.paymentModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  imageContainer: {
    position: 'relative',
    height: width * 0.8,
    backgroundColor: '#fff',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  shareButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    lineHeight: 30,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  itemDescription: {
    fontSize: 15,
    color: '#6c757d',
    lineHeight: 22,
    marginBottom: 15,
  },
  ratingSection: {
    marginBottom: 15,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    marginRight: 8,
  },
  star: {
    fontSize: 16,
  },
  ratingText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  outOfStockBanner: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  outOfStockBannerText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lowStockBanner: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  lowStockBannerText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  cartStatus: {
    backgroundColor: '#d1edff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  cartStatusText: {
    fontSize: 14,
    color: '#2980b9',
    fontWeight: '500',
  },
  quantityContainer: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
  },
  quantityButton: {
    backgroundColor: '#8e44ad',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 15,
    minWidth: 80,
    color: '#2c3e50',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartButton: {
    backgroundColor: '#8e44ad',
  },
  buyButton: {
    backgroundColor: '#27ae60',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outOfStockContainer: {
    backgroundColor: '#fee',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  outOfStockMessage: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    lineHeight: 24,
  },
  reviewsSection: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  expandIcon: {
    fontSize: 14,
    color: '#6c757d',
  },
  reviewsList: {
    marginTop: 10,
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8e44ad',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  reviewText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.9,
    height: height * 0.7,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  paymentModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  paymentModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  paymentModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  paymentOptionIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  paymentOptionText: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  paymentOptionDesc: {
    fontSize: 13,
    color: '#6c757d',
  },
  paymentModalCancel: {
    backgroundColor: '#e9ecef',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  paymentModalCancelText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});