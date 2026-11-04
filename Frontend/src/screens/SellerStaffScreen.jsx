import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import SellerHeader from '../components/seller/SellerHeader';
import EmptyState from '../components/seller/EmptyState';
import LoadingSkeleton from '../components/seller/LoadingSkeleton';
import sellerService from '../services/sellerService';
import styles from './SellerStaffScreen.styles';

export const SellerStaffScreen = ({ navigation }) => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Invite Modal
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('order_manager');
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await sellerService.getStaff();
      const list = Array.isArray(res) ? res : res.staff || res.data || [];
      setStaffList(list);
    } catch (err) {
      console.warn('Staff fetch warning:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStaff();
  };

  const handleInvite = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Validation Error', 'Please provide employee name, email and phone number.');
      return;
    }

    setSubmitting(true);
    try {
      await sellerService.inviteStaff({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim().replace(/[^0-9]/g, ''),
        role,
      });
      Alert.alert('Staff Invited', `${name} has been added as ${role.replace('_', ' ')}.`);
      setInviteModalVisible(false);
      setName('');
      setEmail('');
      setPhone('');
      fetchStaff();
    } catch (e) {
      Alert.alert('Invitation Failed', e.message || 'Could not add employee.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member) => {
    const newStatus = member.status === 'active' ? 'revoked' : 'active';
    try {
      await sellerService.updateStaffStatus(member._id, newStatus);
      Alert.alert('Access Updated', `Staff access changed to ${newStatus}.`);
      fetchStaff();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update staff status');
    }
  };

  const handleAttendance = async (member, action = 'check_in') => {
    try {
      await sellerService.recordStaffAttendance(member._id, 'morning', action);
      Alert.alert('Attendance Logged', `${member.name} marked as ${action.replace('_', ' ')}.`);
      fetchStaff();
    } catch (e) {
      Alert.alert('Attendance Error', e.message || 'Could not log shift attendance');
    }
  };

  const roles = [
    { id: 'manager', label: 'Store Manager' },
    { id: 'order_manager', label: 'Order Manager' },
    { id: 'inventory_manager', label: 'Inventory Manager' },
    { id: 'packing_staff', label: 'Packing Staff' },
  ];

  return (
    <View style={styles.container}>
      <SellerHeader
        title="Staff & Permissions"
        subtitle={`${staffList.length} team members`}
        navigation={navigation}
        rightIcon="person-add-outline"
        onRightPress={() => setInviteModalVisible(true)}
      />

      {loading ? (
        <View style={{ padding: 16 }}>
          <LoadingSkeleton count={3} />
        </View>
      ) : (
        <FlatList
          data={staffList}
          keyExtractor={(item) => item._id || String(Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
          renderItem={({ item }) => {
            const isActive = item.status === 'active';
            const roleName = (item.role || 'staff').replace('_', ' ').toUpperCase();

            return (
              <View style={styles.staffCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || 'E'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.staffName}>{item.name}</Text>
                    <Text style={styles.staffContact}>
                      {item.phone} • {item.email}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isActive ? styles.statusActive : styles.statusRevoked,
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        isActive ? styles.statusTextActive : styles.statusTextRevoked,
                      ]}>
                      {item.status?.toUpperCase() || 'ACTIVE'}
                    </Text>
                  </View>
                </View>

                {/* Role & Permissions */}
                <View style={styles.roleRow}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>Role: {roleName}</Text>
                  </View>
                  <Text style={styles.shiftText}>
                    Shift: {(item.shift?.type || 'Full Day').toUpperCase()}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.btnAction, { backgroundColor: '#EFF6FF' }]}
                    onPress={() => handleAttendance(item, 'check_in')}>
                    <Text style={[styles.btnActionText, { color: '#2563EB' }]}>✓ Check-In</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnAction, { backgroundColor: '#F8FAFC' }]}
                    onPress={() => handleAttendance(item, 'check_out')}>
                    <Text style={[styles.btnActionText, { color: '#475569' }]}>Check-Out</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.btnAction,
                      { backgroundColor: isActive ? '#FEF2F2' : '#ECFDF5' },
                    ]}
                    onPress={() => handleToggleStatus(item)}>
                    <Text
                      style={[
                        styles.btnActionText,
                        { color: isActive ? '#DC2626' : '#059669' },
                      ]}>
                      {isActive ? 'Revoke Access' : 'Activate Access'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No Store Staff Added"
              description="Invite packing staff, inventory managers or store supervisors to your shop."
              actionLabel="+ Invite Store Staff"
              onAction={() => setInviteModalVisible(true)}
            />
          }
        />
      )}

      {/* Invite Modal */}
      <Modal visible={inviteModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Store Employee</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <AppIcon name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Employee Full Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.fieldLabel}>Mobile Number *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="10-digit mobile"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.fieldLabel}>Email Address *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ramesh@appecom.in"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.fieldLabel}>Assign Store Role:</Text>
            <View style={styles.rolesGrid}>
              {roles.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.roleSelectBtn, role === r.id && styles.roleSelectBtnActive]}
                  onPress={() => setRole(r.id)}>
                  <Text
                    style={[
                      styles.roleSelectText,
                      role === r.id && styles.roleSelectTextActive,
                    ]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleInvite}
              disabled={submitting}>
              <Text style={styles.confirmBtnText}>
                {submitting ? 'Sending...' : 'Send Staff Invitation'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SellerStaffScreen;

