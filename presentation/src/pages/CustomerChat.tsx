import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform, Alert, Animated, Modal } from 'react-native';
import { apiService } from '../services/api.service';

interface CustomerChatProps {
  user: any;
  onLogout: () => void;
}

const CustomConfirmModal = ({ visible, title, message, onConfirm, onCancel, confirmText, cancelText, isDestructive }: any) => {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.modalBtnCancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, isDestructive ? styles.modalBtnDestructive : styles.modalBtnConfirm]} onPress={onConfirm} activeOpacity={0.7}>
              <Text style={styles.modalBtnConfirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const AppointmentCard = ({ payload }: { payload: any }) => {
  if (!payload || !payload.data || payload.data.length === 0) return null;
  const isBook = payload.type === 'BOOK_SUCCESS';

  return (
    <View style={styles.appCardContainer}>
      <Text style={styles.appCardTitle}>
        {isBook ? 'ใบนัดหมายใหม่ของคุณ 🏥' : 'บัตรนัดหมายของคุณ 🏥'}
      </Text>
      {payload.data.map((q: any, i: number) => (
        <View key={i} style={styles.appCardInner}>
          <Text style={styles.appCardQueue}>คิวที่: Q{q.queue_number || q.queueNumber}</Text>
          <Text style={styles.appCardDetail}>📅 วันที่: {q.booking_date || q.bookingDate}</Text>
          <Text style={styles.appCardDetail}>⏰ เวลา: {q.booking_time || q.bookingTime || 'ไม่ระบุ'}</Text>
          <Text style={styles.appCardDetail}>🩺 อาการ: {q.symptoms || '-'}</Text>
          <View style={[styles.appCardBadge, q.status === 'WAITING' || !q.status ? styles.appCardBadgeWait : styles.appCardBadgeReady]}>
            <Text style={[styles.appCardBadgeText, q.status === 'WAITING' || !q.status ? {color: '#854D0E'} : {color: '#065F46'}]}>
              {q.status || 'WAITING'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const AnimatedMessage = ({ msg }: { msg: any }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(15));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const isUser = msg.sender === 'user';
  return (
    <Animated.View style={[
      styles.bubbleWrapper,
      isUser ? styles.userWrapper : styles.aiWrapper,
      { opacity: fadeAnim, transform: [{ translateY }] }
    ]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={isUser ? styles.userText : styles.aiText}>{msg.text}</Text>
        {msg.actionResult && <AppointmentCard payload={msg.actionResult} />}
      </View>
    </Animated.View>
  );
};

export default function CustomerChat({ user, onLogout }: CustomerChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{visible: boolean, type: 'clear'|'logout'|null}>({visible: false, type: null});

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await apiService.getChatHistory(user.username);
        if (history && history.length > 0) {
          const formatted = history.map((h: any, i: number) => {
            let text = h.content;
            let actionResult = null;
            try {
              const parsed = JSON.parse(h.content);
              if (parsed.text) {
                text = parsed.text;
                actionResult = parsed.action_result;
              }
            } catch(e) {}
            return {
              id: i + Date.now().toString(),
              text: text,
              sender: h.role === 'user' ? 'user' : 'ai',
              actionResult
            };
          });
          setMessages(formatted);
        } else {
          let greeting = `สวัสดีคุณ ${user.name} ผมเป็น AI ผู้ช่วยของคลินิก มีอะไรให้ช่วยไหมครับ?`;
          try {
            const cats = await apiService.getCategories();
            const activeCats = cats.filter((c: any) => c.is_active).map((c: any) => c.name);
            if (activeCats.length > 0) {
              greeting = `สวัสดีคุณ ${user.name} วันนี้เรามีบริการ: ${activeCats.join(', ')} ต้องการจองคิวรับบริการใดดีครับ?`;
            }
          } catch (e) {}
          setMessages([{ id: Date.now().toString(), text: greeting, sender: 'ai' }]);
        }
      } catch (e) {
        console.error('History load error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleClearHistory = () => {
    setConfirmModal({ visible: true, type: 'clear' });
  };

  const confirmAction = async () => {
    const type = confirmModal.type;
    setConfirmModal({ visible: false, type: null });

    if (type === 'clear') {
      setLoading(true);
      try {
        await apiService.clearChatHistory(user.username);
        setMessages([{ id: Date.now().toString(), text: `สวัสดีคุณ ${user.name} ผมเป็น AI ผู้ช่วยของคลินิก มีอะไรให้ช่วยไหมครับ?`, sender: 'ai' }]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    } else if (type === 'logout') {
      onLogout();
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMsg = { id: Date.now().toString() + 'user', text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    
    try {
      const data = await apiService.chat(user.username, inputText, []); 
      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', text: data.reply, sender: 'ai', actionResult: data.action_result }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString() + 'err', text: 'ขออภัยครับ ติดต่อ AI ไม่ได้', sender: 'ai' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomConfirmModal 
        visible={confirmModal.visible}
        title={confirmModal.type === 'clear' ? "ล้างห้องแชท" : "ออกจากระบบ"}
        message={confirmModal.type === 'clear' ? "คุณต้องการลบข้อความนัดหมายและประวัติการพูดคุยทั้งหมดใช่หรือไม่?" : "คุณต้องการออกจากระบบใช่หรือไม่?"}
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        isDestructive={true}
        onConfirm={confirmAction}
        onCancel={() => setConfirmModal({ visible: false, type: null })}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>พูดคุยกับ AI</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleClearHistory} activeOpacity={0.7}>
            <Text style={styles.clearText}>ล้างแชท</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setConfirmModal({ visible: true, type: 'logout' })} activeOpacity={0.7}>
            <Text style={styles.logoutText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.chatArea} contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map(msg => (
          <AnimatedMessage key={msg.id} msg={msg} />
        ))}
        {isTyping && <ActivityIndicator size="small" color="#05BFDB" style={{ alignSelf: 'flex-start', marginLeft: 16, marginTop: 8 }} />}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput 
          style={styles.input} 
          placeholder="ถามข้อมูลหรือจองคิว..." 
          placeholderTextColor="#94A3B8"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={isTyping} activeOpacity={0.8}>
          <Text style={styles.sendButtonText}>ส่ง</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { 
    paddingTop: 50, 
    paddingHorizontal: 24, 
    paddingBottom: 20, 
    backgroundColor: '#0A4D68', 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0A4D68',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  clearText: { color: '#FF8A65', fontWeight: 'bold', fontSize: 13, padding: 8 },
  logoutText: { color: '#E0F2FE', fontWeight: 'bold', fontSize: 13, padding: 8, marginLeft: 8 },
  chatArea: { flex: 1, padding: 20 },
  bubbleWrapper: { marginBottom: 16, maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end' },
  aiWrapper: { alignSelf: 'flex-start' },
  bubble: { 
    padding: 14, 
    shadowOpacity: 0.05, 
    shadowRadius: 6, 
    shadowOffset: { width: 0, height: 3 }, 
    elevation: 2 
  },
  userBubble: { 
    backgroundColor: '#05BFDB', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 4,
  },
  aiBubble: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    borderBottomRightRadius: 20, 
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  userText: { color: 'white', fontSize: 15, lineHeight: 22 },
  aiText: { color: '#334155', fontSize: 15, lineHeight: 22 },
  inputArea: { 
    padding: 16, 
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    flexDirection: 'row', 
    backgroundColor: 'white', 
    alignItems: 'flex-end',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 10,
    elevation: 10
  },
  input: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    borderRadius: 24, 
    paddingHorizontal: 20, 
    paddingTop: 14,
    paddingBottom: 14, 
    marginRight: 12, 
    maxHeight: 120,
    fontSize: 15,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: { 
    backgroundColor: '#0A4D68', 
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    shadowColor: '#0A4D68',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 2
  },
  sendButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  appCardContainer: { marginTop: 12, backgroundColor: '#E0F2FE', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  appCardTitle: { fontSize: 15, fontWeight: '800', color: '#0369A1', marginBottom: 12 },
  appCardInner: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#0A4D68', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 1 },
  appCardQueue: { fontSize: 18, fontWeight: '800', color: '#0A4D68', marginBottom: 4 },
  appCardDetail: { fontSize: 14, color: '#475569', marginBottom: 2, fontWeight: '500' },
  appCardBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  appCardBadgeWait: { backgroundColor: '#FEF08A' },
  appCardBadgeReady: { backgroundColor: '#AEE9D1' },
  appCardBadgeText: { fontSize: 12, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 77, 104, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 320, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 10 }, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0A4D68', marginBottom: 8, textAlign: 'center' },
  modalMessage: { fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginHorizontal: 6 },
  modalBtnCancel: { backgroundColor: '#F1F5F9' },
  modalBtnCancelText: { color: '#64748B', fontWeight: '800', fontSize: 15 },
  modalBtnConfirm: { backgroundColor: '#05BFDB' },
  modalBtnDestructive: { backgroundColor: '#FF8A65' },
  modalBtnConfirmText: { color: 'white', fontWeight: '800', fontSize: 15 }
});
