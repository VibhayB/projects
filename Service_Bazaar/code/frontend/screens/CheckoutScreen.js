import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../utils/config';

export default function CheckoutScreen({ navigation, route }) {
  const { cartItems } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderSummary, setOrderSummary] = useState(null);
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    loadUserSession();
    calculateOrderSummary();
  }, []);

  const loadUserSession = async () => {
    try {
      const sessionId = await AsyncStorage.getItem('sessionId');
      setUserSession(sessionId);
    } catch (error) {
      console.warn('Failed to load session:', error);
    }
  };

  const calculateOrderSummary = () => {
    if (!cartItems || cartItems.length === 0) {
      navigation.goBack();
      return;
    }

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 0; // Free shipping
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shipping + tax;

    setOrderSummary({
      subtotal,
      shipping,
      tax,
      total,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    });
  };

  const processOrder = async () => {
    if (!userSession) {
      Alert.alert(
        'Login Required',
        'Please login to complete your purchase',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    try {
      setLoading(true);

      // Create orders for each item (endpoint processes one item at a time)
      const ordersPromises = cartItems.map(item => {
        const orderData = {
          sessionId: userSession,
          itemId: item.id,
          quantity: item.quantity,
          paymentMode: paymentMethod,
          razorpayPaymentId: null, 
          orderTimestamp: new Date().toISOString()
        };

        console.log('Sending order data:', orderData);

        return fetch(`${config.BASE_URL}/order-supply`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(orderData)
        }).then(async response => {
          const responseText = await response.text();
          console.log('Raw response:', responseText);
          
          try {
            return JSON.parse(responseText);
          } catch (parseError) {
            console.error('JSON Parse Error:', parseError, 'Response:', responseText);
            throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}`);
          }
        });
      });

      const results = await Promise.all(ordersPromises);
      console.log('All order results:', results);
      
      const allSuccessful = results.every(result => result && result.success === true);
      
      if (allSuccessful) {
        await AsyncStorage.removeItem('cart');
        
        Alert.alert(
          'Order Placed Successfully!',
          `Your ${cartItems.length} item${cartItems.length > 1 ? 's' : ''} have been ordered.\n\nTotal: ₹${orderSummary?.total.toFixed(2)}`,
          [
            {
              text: 'View Orders',
              onPress: () => navigation.replace('OrderHistory')
            },
            {
              text: 'Continue Shopping',
              onPress: () => navigation.navigate('Supplies')
            }
          ]
        );
      } else {
        const errorResult = results.find(result => !result || !result.success);
        const errorMessage = errorResult?.error || errorResult?.message || 'Some items failed to order';
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('Order processing error:', error);
      
      if (error.message.includes('JSON') || error.message.includes('Unexpected')) {
        Alert.alert(
          'Server Error',
          'The server returned an unexpected response. Please check if the server is running.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Order Failed', 
          error.message || 'Failed to place order. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = () => {
    Alert.alert(
      'Confirm Order',
      `Total: ₹${orderSummary?.total.toFixed(2)}\n\nProceed with ${paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Order',
          onPress: processOrder,
          style: 'default'
        }
      ]
    );
  };

  const renderOrderItem = (item, index) => (
    <View key={item.id} style={styles.orderItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
    </View>
  );

  if (!cartItems || cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Cart is Empty</Text>
          <Text style={styles.emptyMessage}>Add items to checkout</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back to Cart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({orderSummary?.itemCount})</Text>
          <View style={styles.itemsContainer}>
            {cartItems.map(renderOrderItem)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'cash' && styles.paymentOptionSelected
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Text style={styles.paymentIcon}>💵</Text>
              <View style={styles.paymentText}>
                <Text style={[
                  styles.paymentTitle,
                  paymentMethod === 'cash' && styles.paymentTitleSelected
                ]}>
                  Cash on Delivery
                </Text>
                <Text style={styles.paymentDesc}>Pay when service is delivered</Text>
              </View>
              {paymentMethod === 'cash' && (
                <Text style={styles.selectedIcon}>✓</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{orderSummary?.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValueFree}>Free</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (18%)</Text>
              <Text style={styles.summaryValue}>₹{orderSummary?.tax.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{orderSummary?.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalFooter}>
          <Text style={styles.totalFooterLabel}>Total:</Text>
          <Text style={styles.totalFooterAmount}>₹{orderSummary?.total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={confirmOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.checkoutIcon}>✓</Text>
              <Text style={styles.checkoutButtonText}>
                Place Order
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
    

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButtonHeader: {
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  itemsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#64748b',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7c3aed',
  },
  paymentOptions: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  paymentOptionSelected: {
    borderColor: '#7c3aed',
    backgroundColor: '#f5f3ff',
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentText: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  paymentTitleSelected: {
    color: '#7c3aed',
  },
  paymentDesc: {
    fontSize: 13,
    color: '#64748b',
  },
  selectedIcon: {
    fontSize: 18,
    color: '#7c3aed',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  summaryValueFree: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16a34a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#7c3aed',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  totalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalFooterLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalFooterAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#7c3aed',
  },
  checkoutButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  checkoutIcon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 10,
    fontWeight: 'bold',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});