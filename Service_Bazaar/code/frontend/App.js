  // App.js (or index.js) – updated
  import React, { useEffect, useState } from 'react';
  import {
    View, Text, TouchableOpacity, Alert, Image, Modal,
  } from 'react-native';
  import { NavigationContainer } from '@react-navigation/native';
  import { createStackNavigator } from '@react-navigation/stack';
  import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { Ionicons } from '@expo/vector-icons'; 

  import { LocationProvider } from './contexts/LocationContext';

  import config                   from './utils/config';

  import {RatingModal,StarRating} from './components/RatingModal';

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
  import ProviderBookingsScreen from './screens/ProviderBookingsScreen';
  import ProviderRatingsScreen from './screens/ProviderRatingsScreen';
  import CartScreen from './screens/CartScreen';
  import OrderHistoryScreen     from './screens/OrderHistoryScreen';
  import OrderDetailScreen     from './screens/OrderDetailScreen';
  import RateProductScreen     from './screens/RateProductScreen';
  import WishlistScreen     from './screens/WishlistScreen';
  import CheckoutScreen     from './screens/CheckoutScreen';

  const Stack = createStackNavigator();
  const Tab   = createBottomTabNavigator();

  function MainTabs({ setIsLoggedIn, isProvider }) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Query') {
                iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              } else if (route.name === 'History') {
                iconName = focused ? 'time' : 'time-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              } else if (route.name === 'Supplies') {
                iconName = focused ? 'cart' : 'cart-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Home"   component={HomeScreen} />
          <Tab.Screen name="Query"  component={QueryScreen} />
          {isProvider && (
            <>
              <Tab.Screen name="Supplies" component={SuppliesScreen} />
            </>
          )}
          <Tab.Screen name="History" component={BookingHistoryScreen} />
          <Tab.Screen name="Profile">
            {(p) => <ProfileScreen {...p} setIsLoggedIn={setIsLoggedIn} />}
          </Tab.Screen>
        </Tab.Navigator>
      </SafeAreaView>
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
        
        // Filter completed bookings that haven't been rated
        const completedUnrated = list.filter(b => 
          b.state === 'completed' && 
          (!b.rated || b.rated === null || b.rated === false)
        );
        
        setPending(completedUnrated);
      })();
    }, [isLoggedIn, loading]);

    useEffect(() => {
      if (pendingRatings.length && !currentRating) {
        setCurrent(pendingRatings[0]);
      }
    }, [pendingRatings, currentRating]);

    // Function to mark booking as rated
    const markBookingAsRated = async (bookingId) => {
      try {
        await fetch(`${config.BASE_URL}/mark-booking-rated`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, rated: true }),
        });
      } catch (err) {
        console.warn('Error marking booking as rated:', err);
      }
    };

    if (loading) return null;
    
    return (
      <>
      <LocationProvider>
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
                <Stack.Screen name="ProviderBookings"       component={ProviderBookingsScreen} />
                <Stack.Screen name="ProviderRatings" component={ProviderRatingsScreen} />
                <Stack.Screen name="Booking"            component={BookingScreen} />
                <Stack.Screen name="ServiceScreen"      component={ServiceScreen} />
                <Stack.Screen
                  name="BookingChat"
                  component={BookingChatScreen}
                  options={({ route }) => ({
                    title: `Chat – ${route.params?.providerName ?? 'Provider'}`,
                  })}
                />
                <Stack.Screen name="QueryChat"       component={QueryChatScreen} />
                <Stack.Screen name="SupplyDetail"       component={SupplyDetailScreen} />
                <Stack.Screen name="Cart"       component={CartScreen} />
                <Stack.Screen 
                  name="OrderHistory" 
                  component={OrderHistoryScreen}
                  options={{ title: 'My Orders' }}
                />
                <Stack.Screen 
                  name="OrderDetail" 
                  component={OrderDetailScreen}
                  options={{ title: 'Order Details' }}
                />
                <Stack.Screen 
                  name="RateProduct" 
                  component={RateProductScreen}
                  options={{ title: 'Rate Product' }}
                />
                <Stack.Screen 
                  name="Wishlist" 
                  component={WishlistScreen}
                  options={{ title: 'My Wishlist' }}
                />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="WorkerApplication"  component={WorkerApplicationScreen} />
                <Stack.Screen name="ProviderStats"  component={ProviderStatsScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
        </LocationProvider>

        <RatingModal
          visible={!!currentRating}
          booking={currentRating}
          provider={currentRating ? { 
            name: currentRating.name, 
            service: currentRating.service, 
            image: currentRating.providerImage 
          } : null}
          onSubmit={async ({ stars, text }) => {
            try {
              const response = await fetch(`${config.BASE_URL}/rate-booking`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  bookingId: currentRating.id,
                  providerId: currentRating.providerId,
                  rating: stars,
                  comment: text,
                }),
              });
              if (!response.ok) {
                throw new Error("Failed to submit rating");
              }
              await markBookingAsRated(currentRating.id);
              Alert.alert("Thank you!", "Your rating has been submitted successfully.");
            } catch (err) {
              Alert.alert("Error", "Could not submit rating. Please try again.");
              console.error("Rating submission error:", err);
            } finally {
              setPending(p => p.slice(1));
              setCurrent(null);
            }
          }}
          onSkip={async () => {
              setPending(p => p.slice(1));
              setCurrent(null);
          }}
        />
      </>
    );
  }