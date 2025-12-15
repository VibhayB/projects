import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import config from '../utils/config';

const ProfileScreen = ({ setIsLoggedIn }) => {
  const navigation = useNavigation();
  const [sessionId, setSessionId] = useState('');
  const [profile, setProfile] = useState({ name: '', email: '', contact: '', image: '' }); 
  const [originalProfile, setOriginalProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [providerIds, setProviderIds] = useState([]);
  const [isWorkerApplied, setIsWorkerApplied] = useState(false);
  const [isProvider, setIsProvider] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('sessionId').then(setSessionId);
  }, []);

useEffect(() => {
  if (!sessionId) return;

  (async () => {
    try {
      const profileRes = await fetch(`${config.BASE_URL}/profile/${sessionId}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(prev => ({ ...prev, ...profileData }));
        setOriginalProfile(profileData);
      }

      const userRes = await fetch(`${config.BASE_URL}/user-by-session/${sessionId}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setProfile(prev => ({ 
          ...prev, 
          email: userData.email || '',
          providerInfos: userData.providerInfos || [] 
        }));
        
        setIsProvider((userData.providerInfos || []).length > 0);
        
        setProviderIds(userData.providerInfos?.map(info => info.id) || []);
      }
    } catch (e) {
      console.error('Profile fetch failed:', e);
    }
  })();
}, [sessionId]);

  const handleSave = async () => {
    try {
      const updateData = { sessionId };
      if (profile.name?.trim()) {
        updateData.name = profile.name;
      }
      if (profile.contact?.trim()) {
        updateData.contact = profile.contact;
      }
      if (profile.image?.trim()) {
        updateData.image = profile.image;
      }

      const res = await fetch(`${config.BASE_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'save failed');
      }

      Alert.alert('Profile Updated', 'Your details have been saved.');
      setOriginalProfile({ 
        name: profile.name, 
        contact: profile.contact,
        image: profile.image 
      });
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save profile.');
    }
  };

  const handleCancel = () => {
    setProfile(prev => ({ ...prev, ...originalProfile }));
    setEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Confirm Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('sessionId');
            setIsLoggedIn(false);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSupport = () => {
    Linking.openURL('mailto:servicebazaar@gmail.com?subject=Support Request');
  };

  const handleTerms = () => {
    Alert.alert(
      'Terms and Conditions',
      'By using this app, you agree to our Terms and Conditions. These include:\n\n' +
      '1. Use the app responsibly and in compliance with all applicable laws.\n' +
      '2. Do not misuse the app or engage in fraudulent activities.\n' +
      '3. Respect the privacy and rights of other users.\n' +
      '4. We reserve the right to terminate accounts for violations of these terms.\n\n' +
      'For full details, contact support.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'We value your privacy. Our Privacy Policy includes:\n\n' +
      '1. We collect only necessary personal information (name, contact, email).\n' +
      '2. Your data is used to provide and improve our services.\n' +
      '3. We do not share your data with third parties without consent, except as required by law.\n' +
      '4. You can request deletion of your data by contacting support.\n\n' +
      'For full details, contact support.',
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About App',
      'Worker App v1.0\n\nConnecting skilled workers with customers.\n\nBuild your career with us!',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <View style={styles.avatarContainer}>
            {profile.image ? (
              <Image
                source={{ uri: profile.image }}
                style={styles.avatarImage}
                onError={() => setProfile(prev => ({ ...prev, image: '' }))}
              />
            ) : (
              <Icon name="person" size={40} color="#666" />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{profile.name || 'User'}</Text>
            <Text style={styles.headerEmail}>{profile.email || '—'}</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={editing ? handleSave : () => setEditing(true)}
            activeOpacity={0.7}
            accessibilityLabel={editing ? 'Save profile' : 'Edit profile'}
          >
            <Icon name={editing ? 'save' : 'edit'} size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          {(editing ? ['name', 'contact', 'image'] : ['contact']).map(key => (
            editing ? (
              <TextInput
                key={key}
                placeholder={
                  key === 'name' ? 'Name' :
                  key === 'contact' ? 'Contact Number' :
                  key === 'image' ? 'Image URL (e.g., https://example.com/image.jpg)' :
                  key.charAt(0).toUpperCase() + key.slice(1)
                }
                value={profile[key]}
                onChangeText={txt => setProfile(p => ({ ...p, [key]: txt }))}
                keyboardType={key === 'contact' ? 'phone-pad' : key === 'image' ? 'url' : 'default'}
                style={styles.input}
              />
            ) : (
              <View key={key} style={styles.row}>
                <Icon
                  name={key === 'contact' ? 'phone' : 'person'}
                  size={18}
                  color="#666"
                />
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>
                    {key === 'contact' ? 'Contact' : 'Name'}
                  </Text>
                  <Text style={styles.value}>{profile[key] || '—'}</Text>
                </View>
              </View>
            )
          ))}
          {editing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.7}
                accessibilityLabel="Cancel editing"
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
                activeOpacity={0.7}
                accessibilityLabel="Save profile"
              >
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!editing && (
          <View style={styles.actionContainer}>
            
{isProvider && (
  <TouchableOpacity
    style={[styles.actionButton, styles.statsButton]}
    onPress={() => {
      console.log('Provider IDs for stats:', providerIds);
      
      if (!providerIds || providerIds.length === 0) {
        Alert.alert('Error', 'No provider IDs available');
        return;
      }
      
      navigation.navigate('ProviderStats', { 
        providerIds: providerIds 
      });
    }}
    activeOpacity={0.7}
  >
    <Icon name="bar-chart" size={16} color="#fff" />
    <Text style={styles.actionButtonText}>Stats</Text>
  </TouchableOpacity>
)}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isWorkerApplied ? '#aaa' : '#2ecc71' }]}
              onPress={() => {
                if (isWorkerApplied) return;
                navigation.navigate('WorkerApplication');
              }}
              disabled={isWorkerApplied}
              activeOpacity={0.7}
              accessibilityLabel={isWorkerApplied ? 'Application submitted' : 'Apply as worker'}
            >
              <Icon name="work" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>
                {isWorkerApplied ? 'Applied' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!editing && (
          <View style={styles.optionsCard}>
            <Text style={styles.optionsTitle}>App Information</Text>
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={handleSupport}
            >
              <Icon name="support-agent" size={24} color="#007AFF" />
              <Text style={styles.optionText}>Support</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionItem}
              onPress={handleTerms}
            >
              <Icon name="description" size={24} color="#007AFF" />
              <Text style={styles.optionText}>Terms and Conditions</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionItem}
              onPress={handlePrivacy}
            >
              <Icon name="security" size={24} color="#007AFF" />
              <Text style={styles.optionText}>Privacy Policy</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionItem}
              onPress={handleAbout}
            >
              <Icon name="info" size={24} color="#007AFF" />
              <Text style={styles.optionText}>About App</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
        )}

        {!editing && (
          <TouchableOpacity
            style={styles.signOutContainer}
            onPress={handleSignOut}
            activeOpacity={0.7}
            accessibilityLabel="Sign out"
          >
            <Icon name="logout" size={24} color="#e74c3c" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  headerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelContainer: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsButton: {
    backgroundColor: '#8e44ad',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flex: 1,
    marginRight: 4,
  },
  cancelButton: {
    backgroundColor: '#aaa',
    flex: 1,
    marginLeft: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  optionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  signOutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    color: '#e74c3c',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default ProfileScreen;