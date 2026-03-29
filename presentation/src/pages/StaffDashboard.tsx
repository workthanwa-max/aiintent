import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl, TextInput, Switch, Platform, Alert, Modal } from 'react-native';
import { apiService } from '../services/api.service';

interface StaffDashboardProps {
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

const QueueDetailModal = ({ visible, queue, onClose }: any) => {
  if (!visible || !queue) return null;
  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>รายละเอียดการนัดหมาย</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>ปิด</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.detailScroll}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>หมายเลขคิว:</Text>
              <Text style={styles.detailValue}>Q{queue.queue_number}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ชื่อผู้ป่วย:</Text>
              <Text style={styles.detailValue}>{queue.customer_name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>วันที่นัด:</Text>
              <Text style={styles.detailValue}>{queue.booking_date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>เวลานัด:</Text>
              <Text style={styles.detailValue}>{queue.booking_time || 'ไม่ระบุ'}</Text>
            </View>
            <View style={styles.detailDivider} />
            <Text style={styles.detailLabel}>อาการ/เหตุผลที่นอน:</Text>
            <Text style={styles.detailLongText}>{queue.symptoms || '— ไม่ระบุ —'}</Text>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>สถานะปัจจุบัน:</Text>
              <View style={[styles.badge, queue.status === 'WAITING' ? styles.waitBadge : styles.progressBadge]}>
                <Text style={[styles.badgeText, queue.status === 'WAITING' ? { color: '#854D0E' } : { color: '#065F46' }]}>{queue.status}</Text>
              </View>
            </View>
          </ScrollView>
          
          <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
            <Text style={styles.actionBtnText}>รับทราบ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function StaffDashboard({ user, onLogout }: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState<'queues'|'categories'>('queues');
  
  const [queues, setQueues] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState<{visible: boolean, type: 'logout'|'delete_category'|null, targetId?: number}>({visible: false, type: null});
  const [selectedQueue, setSelectedQueue] = useState<any>(null);

  const fetchQueues = async () => {
    try {
      const data = await apiService.getTodayQueues();
      setQueues(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiService.getCategories();
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQueues();
    fetchCategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'queues') await fetchQueues();
    if (activeTab === 'categories') await fetchCategories();
    setRefreshing(false);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const res = await apiService.addCategory(newCatName);
      if (res.error) throw new Error(res.error);
      setNewCatName('');
      fetchCategories();
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(e.message);
      else Alert.alert('Error', e.message);
    }
  };

  const handleToggleCategory = async (id: number, currentVal: boolean) => {
    try {
      await apiService.toggleCategory(id, !currentVal);
      fetchCategories();
    } catch (e) {
      console.error(e);
    }
  };

  const requestDeleteCategory = (id: number) => {
    setConfirmModal({ visible: true, type: 'delete_category', targetId: id });
  };

  const requestLogout = () => {
    setConfirmModal({ visible: true, type: 'logout' });
  };

  const executeConfirmAction = async () => {
    const { type, targetId } = confirmModal;
    setConfirmModal({ visible: false, type: null });

    if (type === 'logout') {
      onLogout();
    } else if (type === 'delete_category' && targetId) {
      try {
        await apiService.deleteCategory(targetId);
        fetchCategories();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CustomConfirmModal 
        visible={confirmModal.visible}
        title={confirmModal.type === 'logout' ? "ออกจากระบบ" : "ลบหมวดหมู่บริการ"}
        message={confirmModal.type === 'logout' 
          ? "คุณต้องการออกจากระบบใช่หรือไม่?" 
          : "คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้ ระวัง! หมวดหมู่นี้จะหายไปจากระบบอย่างถาวร"}
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        isDestructive={true}
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmModal({ visible: false, type: null })}
      />

      <QueueDetailModal 
        visible={!!selectedQueue}
        queue={selectedQueue}
        onClose={() => setSelectedQueue(null)}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Dashboard</Text>
        <TouchableOpacity onPress={requestLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'queues' && styles.activeTab]} onPress={() => setActiveTab('queues')} activeOpacity={0.8}>
          <Text style={[styles.tabText, activeTab === 'queues' && styles.activeTabText]}>รายการคิว</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'categories' && styles.activeTab]} onPress={() => setActiveTab('categories')} activeOpacity={0.8}>
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>จัดการบริการ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'queues' && (
          <>
            <View style={styles.welcomeRow}>
              <Text style={styles.welcome}>สวัสดี, {user.name} (เจ้าหน้าที่)</Text>
              <Text style={styles.countText}>{queues.length} รายการ</Text>
            </View>
            {queues.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyText}>ยังไม่มีรายการคิวขณะนี้</Text>
              </View>
            ) : (
              queues.map(q => (
                <TouchableOpacity key={q.id} style={styles.card} activeOpacity={0.8} onPress={() => setSelectedQueue(q)}>
                  <View style={styles.cardLeft}>
                    <View style={styles.queueCircle}>
                      <Text style={styles.queueCircleText}>Q{q.queue_number}</Text>
                    </View>
                  </View>
                  <View style={styles.cardCenter}>
                    <Text style={styles.patientName}>{q.customer_name}</Text>
                    <Text style={styles.cardSubtitle}>{q.booking_date} • {q.booking_time || 'ไม่ระบุเวลา'}</Text>
                    <Text style={styles.symptoms} numberOfLines={1}>{q.symptoms || '— ไม่ระบุอาการ —'}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <View style={[styles.badge, q.status === 'WAITING' ? styles.waitBadge : styles.progressBadge]}>
                        <Text style={[styles.badgeText, q.status === 'WAITING' ? { color: '#854D0E' } : { color: '#065F46' }]}>{q.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {activeTab === 'categories' && (
          <View style={{ paddingBottom: 40, paddingTop: 10 }}>
            <View style={styles.addCategoryRow}>
              <TextInput 
                style={styles.catInput} 
                placeholder="ชื่อบริการใหม่..." 
                placeholderTextColor="#94A3B8"
                value={newCatName}
                onChangeText={setNewCatName}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddCategory} activeOpacity={0.8}>
                <Text style={styles.addButtonText}>เพิ่ม</Text>
              </TouchableOpacity>
            </View>

            {categories.map(cat => (
              <View key={cat.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.patientName, !cat.is_active && { color: '#94A3B8' }]}>{cat.name}</Text>
                  <Text style={[styles.statusText, cat.is_active ? { color: '#05BFDB' } : { color: '#94A3B8' }]}>
                    {cat.is_active ? 'เปิดให้บริการ' : 'ปิดชั่วคราว'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Switch 
                    value={Boolean(cat.is_active)} 
                    onValueChange={() => handleToggleCategory(cat.id, Boolean(cat.is_active))}
                    trackColor={{ false: '#E2E8F0', true: '#05BFDB' }}
                    thumbColor={'white'}
                  />
                  <TouchableOpacity onPress={() => requestDeleteCategory(cat.id)} style={{ marginLeft: 20 }} activeOpacity={0.6}>
                    <Text style={{ color: '#FF8A65', fontWeight: '800', fontSize: 13 }}>ลบ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    paddingTop: 50, paddingHorizontal: 24, paddingBottom: 24, 
    backgroundColor: '#0A4D68', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    shadowColor: '#0A4D68', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8, zIndex: 10
  },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  logoutText: { color: '#E0F2FE', fontWeight: 'bold', fontSize: 14, padding: 8 },
  
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#F1F5F9', 
    marginHorizontal: 20, 
    marginTop: 24, 
    borderRadius: 30, 
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  tab: { 
    flex: 1, 
    paddingVertical: 14, 
    alignItems: 'center', 
    borderRadius: 24,
    backgroundColor: 'transparent'
  },
  activeTab: { backgroundColor: 'white', shadowColor: '#0A4D68', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 },
  tabText: { color: '#94A3B8', fontWeight: '800', fontSize: 14 },
  activeTabText: { color: '#0A4D68' },
  
  content: { padding: 20 },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcome: { fontSize: 16, color: '#64748B', fontWeight: '700' },
  countText: { fontSize: 13, color: '#05BFDB', fontWeight: '800', backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  
  card: { 
    backgroundColor: 'white', borderRadius: 24, 
    marginBottom: 16, flexDirection: 'row', padding: 16, alignItems: 'center',
    shadowColor: '#0A4D68', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  cardLeft: { marginRight: 16 },
  queueCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#05BFDB' },
  queueCircleText: { fontSize: 18, fontWeight: '900', color: '#0A4D68' },
  cardCenter: { flex: 1 },
  patientName: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 2 },
  cardSubtitle: { fontSize: 14, color: '#05BFDB', fontWeight: '800', marginBottom: 4 },
  symptoms: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  cardRight: { alignItems: 'flex-end' },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  waitBadge: { backgroundColor: '#FEF08A' },
  progressBadge: { backgroundColor: '#BBF7D0' },
  badgeText: { fontSize: 11, fontWeight: '900' },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  
  addCategoryRow: { flexDirection: 'row', marginBottom: 24, alignItems: 'stretch' },
  catInput: { flex: 1, backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 24, fontSize: 15, color: '#0F172A', shadowColor: '#0A4D68', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  addButton: { backgroundColor: '#0A4D68', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, borderRadius: 24, marginLeft: 12, shadowColor: '#0A4D68', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6 },
  addButtonText: { color: 'white', fontWeight: '900', fontSize: 15 },
  statusText: { fontSize: 12, fontWeight: '700', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 77, 104, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: 'white', borderRadius: 30, padding: 24, width: '100%', maxWidth: 340, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 10 }, shadowRadius: 24, elevation: 12 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#0A4D68', marginBottom: 10, textAlign: 'center' },
  modalMessage: { fontSize: 16, color: '#475569', textAlign: 'center', marginBottom: 28, lineHeight: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginHorizontal: 8 },
  modalBtnCancel: { backgroundColor: '#F1F5F9' },
  modalBtnCancelText: { color: '#94A3B8', fontWeight: '900', fontSize: 16 },
  modalBtnConfirm: { backgroundColor: '#05BFDB' },
  modalBtnDestructive: { backgroundColor: '#FF8A65' },
  modalBtnConfirmText: { color: 'white', fontWeight: '900', fontSize: 16 },

  detailCard: { backgroundColor: 'white', borderRadius: 32, padding: 30, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 15 }, shadowRadius: 30, elevation: 15 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  detailTitle: { fontSize: 20, fontWeight: '900', color: '#0A4D68' },
  closeText: { color: '#94A3B8', fontSize: 15, fontWeight: '800' },
  detailScroll: { maxHeight: 400 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailLabel: { fontSize: 14, color: '#94A3B8', fontWeight: '700' },
  detailValue: { fontSize: 16, color: '#1E293B', fontWeight: '800' },
  detailDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  detailLongText: { fontSize: 15, color: '#334155', lineHeight: 24, fontWeight: '500', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, marginTop: 10 },
  actionBtn: { backgroundColor: '#0A4D68', paddingVertical: 18, borderRadius: 24, alignItems: 'center', marginTop: 24 },
  actionBtnText: { color: 'white', fontSize: 16, fontWeight: '900' }
});
