import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../utils/config';
import { KeyboardAvoidingView, Platform } from 'react-native';

const DEFAULT_PRODUCT_IMAGE = 'https://cdn3d.iconscout.com/3d/premium/thumb/product-3d-icon-png-download-4863042.png';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  useEffect(() => {
    loadOrderDetail();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setShowCancelForm(false);
      setCancelReason('');
    });

    return unsubscribe;
  }, [navigation]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const sessionId = await AsyncStorage.getItem('sessionId');

      const response = await fetch(
        `${config.BASE_URL}/order-detail/${orderId}?sessionId=${sessionId}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (response.ok) {
        setOrder(data);
      } else {
        throw new Error(data.error || 'Failed to load order');
      }
    } catch (error) {
      console.error('Load order detail error:', error);
      Alert.alert('Error', 'Failed to load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for cancellation');
      return;
    }

    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const sessionId = await AsyncStorage.getItem('sessionId');

              const response = await fetch(
                `${config.BASE_URL}/cancel-order`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId,
                    orderId,
                    reason: cancelReason
                  })
                }
              );

              const data = await response.json();

              if (response.ok) {
                Alert.alert(
                  'Order Cancelled',
                  'Your order has been cancelled successfully',
                  [
                    { 
                      text: 'OK', 
                      onPress: () => {
                        navigation.goBack();
                      }
                    }
                  ]
                );
              } else {
                throw new Error(data.error || 'Failed to cancel order');
              }
            } catch (error) {
              console.error('Cancel order error:', error);
              Alert.alert('Error', error.message);
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      cart: '#95a5a6',
      bought: '#3498db',
      confirmed: '#9b59b6',
      processing: '#f39c12',
      shipped: '#e67e22',
      delivered: '#27ae60',
      cancelled: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  const canCancelOrder = (status) => {
    return !['delivered', 'cancelled', 'shipped'].includes(status);
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


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8e44ad" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusBannerText}>
              {order.status.toUpperCase()}
            </Text>
          </View>

          {/* Order Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order ID:</Text>
              <Text style={styles.infoValue}>#{order.orderId || order.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            {order.estimatedDelivery && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Est. Delivery:</Text>
                <Text style={styles.infoValue}>
                  {new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}
                </Text>
              </View>
            )}
          </View>

          {/* Product Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.productCard}>
              <Image
                source={{ uri: getValidImageUri(order.itemIcon) }}
                style={styles.productImage}
                onError={() => setImageError(true)}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{order.itemName}</Text>
                <Text style={styles.productQuantity}>Quantity: {order.quantity}</Text>
                <Text style={styles.productPrice}>₹{order.unitPrice} × {order.quantity}</Text>
              </View>
            </View>
          </View>

          {/* Price Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Details</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal:</Text>
              <Text style={styles.priceValue}>₹{order.totalCost?.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tax (18%):</Text>
              <Text style={styles.priceValue}>₹{order.tax?.toFixed(2)}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>₹{order.finalAmount?.toFixed(2)}</Text>
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment Mode:</Text>
              <Text style={styles.infoValue}>
                {order.paymentMode === 'cash' ? 'Cash After Service' : 'Razorpay'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment Status:</Text>
              <Text style={[
                styles.infoValue,
                { color: order.paymentStatus === 'completed' ? '#27ae60' : '#f39c12' }
              ]}>
                {order.paymentStatus?.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <Text style={styles.addressText}>{order.deliveryAddress}</Text>
            </View>
          )}

          {/* Special Instructions */}
          {order.specialInstructions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Special Instructions</Text>
              <Text style={styles.instructionsText}>{order.specialInstructions}</Text>
            </View>
          )}

          {/* Cancel Order Section */}
          {canCancelOrder(order.status) && !showCancelForm && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCancelForm(true)}
            >
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}

          {showCancelForm && (
            <View style={styles.cancelForm}>
              <Text style={styles.cancelFormTitle}>Reason for Cancellation</Text>
              <TextInput
                style={styles.cancelInput}
                placeholder="Please provide a reason..."
                placeholderTextColor="#95a5a6"
                multiline
                numberOfLines={4}
                value={cancelReason}
                onChangeText={setCancelReason}
              />
              <View style={styles.cancelActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelActionButton]}
                  onPress={() => setShowCancelForm(false)}
                >
                  <Text style={styles.actionButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmCancelButton]}
                  onPress={handleCancelOrder}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.actionButtonText}>Confirm Cancel</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Rate Product Button */}
          {order.status === 'delivered' && (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => navigation.navigate('RateProduct', { 
                itemId: order.itemId,
                itemName: order.itemName
              })}
            >
              <Text style={styles.rateButtonText}>Rate This Product</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
  },
  statusBanner: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusBannerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    textAlign: 'right',
  },
  productCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  productQuantity: {
    fontSize: 14,
    color: '#6c757d',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e9ecef',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  addressText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 22,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 22,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  cancelFormTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  cancelInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2c3e50',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  cancelActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelActionButton: {
    backgroundColor: '#95a5a6',
  },
  confirmCancelButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rateButton: {
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});