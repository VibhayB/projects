import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';   
import config from '../utils/config';

export default function SupplyDetail({ route, navigation }) {
  const { item } = route.params;              
  const [qty, setQty]        = useState('1');
  const [loading, setLoading]= useState(false);

  const addToCart = async () => {
    const cartStr = await AsyncStorage.getItem('cart');
    const cart    = cartStr ? JSON.parse(cartStr) : [];
    cart.push({ ...item, quantity: parseInt(qty, 10) || 1 });
    await AsyncStorage.setItem('cart', JSON.stringify(cart));
    Alert.alert('Added', 'Item saved to cart.');
  };

  const sendOrder = async (paymentMode, razorId = null) => {
    const sessionId = await AsyncStorage.getItem('sessionId');
    const body = {
      sessionId,
      itemId : item.id,
      quantity: parseInt(qty, 10) || 1,
      paymentMode,
      razorpayPaymentId: razorId
    };
    const r  = await fetch(`${config.BASE_URL}/order-supply`, {
      method : 'POST',
      headers: { 'Content-Type':'application/json' },
      body   : JSON.stringify(body)
    });
    const out = await r.json();
    if (r.ok && out.success) {
      Alert.alert('Success', 'Order placed!');
      navigation.goBack();
    } else {
      Alert.alert('Error', out.error || 'Order failed');
    }
  };

  const buyCash = () => sendOrder('cash');

  const buyRazor = async () => {
    try {
      setLoading(true);
      const options = {
        description: 'Supply purchase',
        currency   : 'INR',
        key        : '<YOUR_RAZORPAY_KEY>',
        amount     : item.price * (parseInt(qty, 10) || 1) * 100,
        name       : item.name,
        prefill    : {},
      };
      const data = await RazorpayCheckout.open(options);
      
      await sendOrder('razorpay', data.razorpay_payment_id);
    } catch (err) {
      if (err?.description !== 'Payment cancelled') {
        Alert.alert('Payment Error', 'Razorpay failed.');
      }
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.icon }} style={styles.bigImg} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>₹ {item.price}</Text>

      <TextInput
        style={styles.qty}
        keyboardType="numeric"
        value={qty}
        onChangeText={setQty}
        placeholder="Qty"
      />

      <TouchableOpacity style={styles.btn} onPress={addToCart}>
        <Text style={styles.btnTxt}>Add to Cart</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn,{backgroundColor:'#27ae60'}]} onPress={buyCash}>
        <Text style={styles.btnTxt}>Buy – Cash After Service</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn,{backgroundColor:'#3f51b5'}]} onPress={buyRazor}>
        <Text style={styles.btnTxt}>Pay Now (Razorpay)</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }}/>}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:16, alignItems:'center' },
  bigImg   :{ width:120, height:120, borderRadius:8, marginBottom:16 },
  name     :{ fontSize:20, fontWeight:'bold', marginBottom:4 },
  price    :{ fontSize:18, marginBottom:16 },
  qty      :{ borderWidth:1, borderColor:'#ccc', borderRadius:8,
              padding:8, width:80, textAlign:'center', marginBottom:16 },
  btn      :{ backgroundColor:'#8e44ad', padding:12, borderRadius:6,
              width:'80%', alignItems:'center', marginBottom:10 },
  btnTxt   :{ color:'#fff', fontWeight:'bold' }
});

