import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AirbnbRating } from 'react-native-ratings';

import config                   from './utils/config';
import LoginScreen              from './screens/LoginScreen';
import HomeScreen               from './screens/HomeScreen';
import ProvidersScreen          from './screens/ProvidersScreen';
import ProviderDetailScreen     from './screens/ProviderDetailScreen';
import BookingHistoryScreen     from './screens/BookingHistoryScreen';
import QueryScreen              from './screens/QueryScreen';
import QueryChatScreen       from './screens/QueryChatScreen';
import ProfileScreen            from './screens/ProfileScreen';
import BookingScreen            from './screens/BookingScreen';
import WorkerApplicationScreen  from './screens/WorkerApplicationScreen';
import ServiceScreen            from './screens/ServiceScreen';
import BookingChatScreen        from './screens/BookingChatScreen';
import SuppliesScreen           from './screens/SuppliesScreen';
import SupplyDetailScreen       from './screens/SupplyDetailScreen';
import ProviderStatsScreen       from './screens/ProviderStatsScreen'; 

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function MainTabs({ setIsLoggedIn, isProvider }) {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home"   component={HomeScreen} />
        <Tab.Screen name="Query"  component={QueryScreen} />
        <Tab.Screen name="History" component={BookingHistoryScreen} />
        <Tab.Screen name="Profile">
          {(p) => <ProfileScreen {...p} setIsLoggedIn={setIsLoggedIn} />}
        </Tab.Screen>
        {isProvider && (
          <>
            <Tab.Screen name="Supplies" component={SuppliesScreen} />
            <Tab.Screen name="Stats" component={ProviderStatsScreen} />
          </>
        )}
      </Tab.Navigator>
    </SafeAreaView>
  );
}

function RatingModal({ visible, booking, onSubmit, onSkip }) {
  const [stars, setStars] = useState(0);
  const [text , setText]  = useState('');
  const [anon , setAnon]  = useState(false);
  const [sending, setSending] = useState(false);
  if (!booking) return null;

  return (
    <View style={[styles.overlay, { display: visible ? 'flex' : 'none' }]}>
      <View style={styles.popup}>
        <Text style={styles.h1}>Rate your service with {booking.name}</Text>

        <AirbnbRating defaultRating={0} size={24} onFinishRating={setStars} />

        <TextInput
          style={styles.textBox}
          placeholder="Add a comment (optional)"
          multiline
          value={text}
          onChangeText={setText}
        />

        <TouchableOpacity onPress={() => setAnon(!anon)}>
          <Text>{anon ? '☑' : '☐'} Comment anonymously</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#27ae60', marginTop: 10 }]}
          disabled={sending || !stars}
          onPress={async () => {
            setSending(true);
            await onSubmit({ stars, text, anon });
            setSending(false);
          }}
        >
          <Text style={{ color: '#fff' }}>Submit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSkip}
          style={[styles.btn, { backgroundColor: '#ccc', marginTop: 6 }]}
        >
          <Text>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  const [isLoggedIn,      setIsLoggedIn]   = useState(false);
  const [loading,         setLoading]      = useState(true);
  const [pendingRatings,  setPending]      = useState([]);
  const [isProvider,      setIsProvider]   = useState(false);
  const [currentRating,   setCurrent]      = useState(null);

  useEffect(() => {
    (async () => {
      const sid = await AsyncStorage.getItem('sessionId');
      setIsLoggedIn(!!sid);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || loading) return;
    (async () => {
      const sid = await AsyncStorage.getItem('sessionId');
      const usr = await fetch(`${config.BASE_URL}/user-by-session/${sid}`).then(r => r.json());
      setIsProvider((usr.providerInfos ?? []).length > 0);
      const res = await fetch(`${config.BASE_URL}/bookings/${sid}`);
      const list = await res.json();
      setPending(list.filter(b => b.state === 'completed'));
    })();
  }, [isLoggedIn, loading]);

  useEffect(() => {
    if (pendingRatings.length && !currentRating) {
      setCurrent(pendingRatings[0]);
    }
  }, [pendingRatings, currentRating]);

  if (loading) return null;

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isLoggedIn ? (
            <Stack.Screen name="Login">
              {(p) => <LoginScreen {...p} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="MainTabs">
                {(p) => (
                  <MainTabs
                    {...p}
                    setIsLoggedIn={setIsLoggedIn}
                    isProvider={isProvider}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="Providers"          component={ProvidersScreen} />
              <Stack.Screen name="ProviderDetail"     component={ProviderDetailScreen} />
              <Stack.Screen name="Booking"            component={BookingScreen} />
              <Stack.Screen name="WorkerApplication"  component={WorkerApplicationScreen} />
              <Stack.Screen name="ServiceScreen"      component={ServiceScreen} />
              <Stack.Screen name="SupplyDetail"       component={SupplyDetailScreen} />
              <Stack.Screen name="QueryChat"       component={QueryChatScreen} />
              <Stack.Screen
                name="BookingChat"
                component={BookingChatScreen}
                options={({ route }) => ({
                  title: `Chat – ${route.params?.providerName ?? 'Provider'}`,
                })}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      <RatingModal
        visible={!!currentRating}
        booking={currentRating}
        onSubmit={async ({ stars, text, anon }) => {
          try {
            await fetch(`${config.BASE_URL}/rate-booking`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId : currentRating.id,
                providerId: currentRating.providerId,
                rating    : stars,
                comment   : text,
                anonymous : anon,
              }),
            });
          } catch (err) {
            Alert.alert('Error', 'Could not submit rating');
            console.error(err);
          } finally {
            setPending(p => p.slice(1));
            setCurrent(null);
          }
        }}
        onSkip={async () => {
   try {
     await fetch(`${config.BASE_URL}/rate-booking`, {
       method : 'POST',
       headers: { 'Content-Type':'application/json' },
       body   : JSON.stringify({
         bookingId : currentRating.id,
         providerId: currentRating.providerId,
         rating    : 0,        
         comment   : '',
         anonymous : true,
       }),
     });
   } catch (e) {
     console.warn('skip-rate error', e);
   } finally {
     setPending(p => p.slice(1));
     setCurrent(null);
   }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay:{ flex:1, position:'absolute', top:0, left:0, right:0, bottom:0,
            backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center' },
  popup  :{ backgroundColor:'#fff', padding:20, borderRadius:10, width:'85%' },
  h1     :{ fontSize:18, fontWeight:'bold', marginBottom:10 },
  textBox:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:10, height:80, marginTop:10 },
  btn    :{ padding:10, borderRadius:6, alignItems:'center' },
});
