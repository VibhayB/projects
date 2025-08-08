import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
         Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';   
import config from '../utils/config';


const ProfileScreen = ({ setIsLoggedIn }) => {
  const navigation = useNavigation();                            
  const [sessionId, setSessionId] = useState('');
  const [profile, setProfile]     = useState({ name:'', contact:'', address:'', skills:'' });
  const [editing, setEditing]     = useState(false);
  const [isWorkerApplied, setIsWorkerApplied] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('sessionId').then(setSessionId);
  }, []);

  useEffect(() => {
    if (!sessionId) return;         
    (async () => {
      try {
        const res = await fetch(`${config.BASE_URL}/profile/${sessionId}`);
        if (!res.ok) return;        
        const data = await res.json();
        setProfile(data);
      } catch (e) {
        console.error('Profile fetch failed:', e);
      }
    })();
  }, [sessionId]);
  const handleSave = async () => {
    try {
      const res = await fetch(`${config.BASE_URL}/profile`, {
        method : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ sessionId, ...profile }),
      });
      if (!res.ok) throw new Error('save failed');
      Alert.alert('Profile Updated', 'Your details have been saved.');
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Could not save profile.');
    }
  };
  
  const handleApplyWorker = () => {
    setIsWorkerApplied(true);           
    Alert.alert('Application Sent', 'Your request to become a worker has been submitted.');
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('sessionId');
    setIsLoggedIn(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Your Profile</Text>

      {['name','contact','address','skills'].map(key => (
        editing ? (
          <TextInput
            key={key}
            placeholder={key === 'skills' ? 'Skills / Expertise'
                      : key === 'contact' ? 'Contact Number'
                      : key.charAt(0).toUpperCase() + key.slice(1)}
            value={profile[key]}
            onChangeText={txt => setProfile(p => ({ ...p, [key]: txt }))}
            multiline={key==='address'}
            keyboardType={key==='contact' ? 'phone-pad' : 'default'}
            style={[styles.input, key==='address' && { height:80 }]}
          />
        ) : (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{key.charAt(0).toUpperCase()+key.slice(1)}:</Text>
            <Text style={styles.value}>{profile[key] || '—'}</Text>
          </View>
        )
      ))}

      {editing ? (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Profile</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.saveButton} onPress={() => setEditing(true)}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
      )}

<TouchableOpacity
  style={[
    styles.applyButton,
    { backgroundColor: isWorkerApplied ? '#aaa' : '#2ecc71' },
  ]}
  onPress={() => {
    if (isWorkerApplied) return;
    navigation.navigate('WorkerApplication');   
  }}
  disabled={isWorkerApplied}
>
  <Text style={styles.buttonText}>
    {isWorkerApplied ? 'Application Submitted' : 'Apply as Worker'}
  </Text>
</TouchableOpacity>


      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, padding:16 },
  header   : { fontSize:22, fontWeight:'bold', marginBottom:12 },
  input    : { borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:10, marginBottom:12 },
  row      : { flexDirection:'row', justifyContent:'space-between', marginBottom:12 },
  label    : { fontWeight:'bold' },
  value    : { flexShrink:1, textAlign:'right' },
  saveButton : { backgroundColor:'#3498db', padding:12, borderRadius:6, alignItems:'center', marginBottom:12 },
  applyButton: { padding:12, borderRadius:6, alignItems:'center', marginBottom:12 },
  signOutButton:{ backgroundColor:'#e74c3c', padding:12, borderRadius:6, alignItems:'center' },
  buttonText  : { color:'#fff', fontWeight:'bold' },
});

export default ProfileScreen;
