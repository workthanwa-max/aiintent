import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { apiService } from '../services/api.service';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.login(username.trim(), password.trim());
      setLoading(false);
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        Alert.alert('ข้อผิดพลาด', data.error || 'Login failed');
      }
    } catch (e) {
      setLoading(false);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🏥</Text>
        </View>
        <Text style={styles.title}>Monnuruk Clinic</Text>
        <Text style={styles.subtitle}>ระบบจองคิวออนไลน์</Text>
        
        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>ชื่อผู้ใช้งาน</Text>
          <TextInput
            style={styles.input}
            placeholder="กรอกชื่อผู้ใช้งาน..."
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>รหัสผ่าน</Text>
          <TextInput
            style={styles.input}
            placeholder="กรอกรหัสผ่าน..."
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>}
        </TouchableOpacity>

        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>บัญชีทดสอบระบบ:</Text>
          <Text style={styles.hintText}>👤 ลูกค้า: user1 / 1234</Text>
          <Text style={styles.hintText}>👨‍⚕️ เจ้าหน้าที่: staff1 / 1234</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F7FA'
  },
  card: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 24,
    shadowColor: '#0A4D68',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  logoPlaceholder: {
    alignSelf: 'center',
    backgroundColor: '#E0F2FE',
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0A4D68',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputBox: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    borderRadius: 16,
    fontSize: 15,
    color: '#0F172A',
  },
  button: {
    backgroundColor: '#05BFDB',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#05BFDB',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hintBox: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    borderRadius: 16,
  },
  hintTitle: {
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 8,
    fontSize: 13,
  },
  hintText: {
    color: '#0284C7',
    fontSize: 13,
    marginBottom: 4,
  }
});
