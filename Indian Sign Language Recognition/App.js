import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SearchSignMenu from './components/SearchSignMenu';
import Quiz from './components/Quiz';

const Stack = createStackNavigator();

const MainMenu = ({ navigation }) => {
  const [isSubMenu, setIsSubMenu] = useState(false);

  const handleSubMenuOptionSelect = (option) => {
    if (option === 'Sign to Text') {
      navigation.navigate('SearchSignMenu');
      setIsSubMenu(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Centralized Section */}
      <View style={styles.contentSection}>
        <Text style={styles.title}>iSignTalk</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Quiz')}
        >
          <Text style={styles.buttonText}>Practise</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => alert('Dictionary (Not implemented yet)')}
        >
          <Text style={styles.buttonText}>Dictionary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setIsSubMenu(true)}
        >
          <Text style={styles.buttonText}>Search a Sign</Text>
        </TouchableOpacity>
      </View>

      {/* Submenu */}
      {isSubMenu && (
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Select an Option</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleSubMenuOptionSelect('Text to Sign')}
          >
            <Text style={styles.menuItemText}>Text to Sign</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleSubMenuOptionSelect('Sign to Text')}
          >
            <Text style={styles.menuItemText}>Sign to Text</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsSubMenu(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MainMenu">
        <Stack.Screen name="MainMenu" component={MainMenu} />
        <Stack.Screen name="SearchSignMenu" component={SearchSignMenu} />
        <Stack.Screen name="Quiz" component={Quiz} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center', // Center the entire section vertically
    alignItems: 'center', // Center the entire section horizontally
  },
  contentSection: {
    alignItems: 'center', // Center content inside this section
    width: '80%', // Optional for better button alignment
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20, // Space between the title and buttons
    color: '#333',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#005a8d',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginVertical: 12, // Spacing between buttons
    width: '100%', // Uniform button width
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, // Adds shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuContainer: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    backgroundColor: '#005a8d',
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    elevation: 5,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 18,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 40,
    backgroundColor: '#d9534f',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    elevation: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default App;
