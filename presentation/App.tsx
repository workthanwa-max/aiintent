import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Platform } from 'react-native';
import { apiService } from './src/services/api.service';
import LoginScreen from './src/pages/LoginScreen';
import CustomerChat from './src/pages/CustomerChat';
import StaffDashboard from './src/pages/StaffDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);

  useEffect(() => {
    apiService.health()
      .then(setServerStatus)
      .catch(() => setServerStatus({ status: 'error' }));
      
    if (Platform.OS === 'web') {
      try {
        const savedUser = window.localStorage.getItem('clinic_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
      } catch (e) { console.error('Failed to load user session', e); }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        if (currentUser) {
          window.localStorage.setItem('clinic_user', JSON.stringify(currentUser));
        } else {
          window.localStorage.removeItem('clinic_user');
        }
      } catch (e) {}
    }
  }, [currentUser]);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        setCurrentUser(null);
      }
    } else {
      Alert.alert(
        'ยืนยันการออกจากระบบ',
        'คุณต้องการออกจากระบบใช่หรือไม่?',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: 'ตกลง', onPress: () => setCurrentUser(null) }
        ]
      );
    }
  };

  if (!currentUser) {
    return (
      <>
        <LoginScreen onLoginSuccess={setCurrentUser} />
        <StatusBar style="auto" />
      </>
    );
  }

  if (currentUser.role === 'STAFF') {
    return (
      <>
        <StaffDashboard user={currentUser} onLogout={handleLogout} />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <CustomerChat user={currentUser} onLogout={handleLogout} />
      <StatusBar style="auto" />
    </>
  );
}
