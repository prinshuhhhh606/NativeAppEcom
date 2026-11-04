import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './NotificationsScreen.styles';
import Header from '../components/Header';
import AppIcon from '../components/AppIcon';
import { Colors } from '../constants/colors';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SAMPLE_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Order BBIN-904123 Shipped!',
    body: 'Your AcousticPro ANC Earbuds are on their way via Delhivery Surface. Track live delivery.',
    time: '2 hours ago',
    icon: 'cube-outline',
    unread: true,
  },
  {
    id: 'n2',
    title: 'Great Indian Artisan Fest is Live 🎉',
    body: 'Flat 50% discount on authentic Kanjivaram silk sarees, Banarasi handlooms, and brass decor.',
    time: '1 day ago',
    icon: 'sparkles-outline',
    unread: false,
  },
  {
    id: 'n3',
    title: 'New Serviceable PIN Codes Added 🚚',
    body: 'We now deliver to 500+ additional postal PIN codes across Assam, Bihar, and Kerala.',
    time: '3 days ago',
    icon: 'location-outline',
    unread: false,
  },
];

export const NotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      const list = res.data?.notifications || res.notifications || [];
      if (Array.isArray(list) && list.length > 0) {
        const formatted = list.map((item) => ({
          id: item._id || item.id,
          title: item.title,
          body: item.message || item.body,
          time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          icon: item.icon || 'notifications-outline',
          unread: !item.isRead,
        }));
        setNotifications(formatted);
      }
    } catch (e) {
      // Fallback gracefully to system announcements
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack navigation={navigation} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => (item.id || item._id).toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 24 },
        ]}
        renderItem={({ item }) => (
          <View style={[styles.notifCard, item.unread && styles.unreadCard]}>
            <View style={styles.iconBox}>
              <AppIcon name={item.icon || 'notifications-outline'} size={20} color={Colors.primary} />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default NotificationsScreen;

