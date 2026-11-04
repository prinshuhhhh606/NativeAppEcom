import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import SellerHeader from '../components/seller/SellerHeader';
import EmptyState from '../components/seller/EmptyState';
import styles from './SellerNotificationsScreen.styles';

export const SellerNotificationsScreen = ({ navigation }) => {
  const initialNotifications = [
    {
      id: 'notif-1',
      type: 'order',
      title: 'New Order Received! (#ORD-98214)',
      message: 'Customer Rahul Sharma placed an order for Handcrafted Cotton Kurta (₹1,828).',
      time: '10 mins ago',
      read: false,
      targetScreen: 'SellerOrders',
    },
    {
      id: 'notif-2',
      type: 'inventory',
      title: 'Low Stock Alert',
      message: 'Brass Diya Set has dropped below buffer threshold (Only 3 units left).',
      time: '1 hour ago',
      read: false,
      targetScreen: 'SellerInventory',
    },
    {
      id: 'notif-3',
      type: 'settlement',
      title: 'Settlement Payout Processed',
      message: '₹24,850 credited to your registered HDFC bank account for Period 24-30 Oct.',
      time: 'Yesterday',
      read: true,
      targetScreen: 'SellerAccounting',
    },
    {
      id: 'notif-4',
      type: 'system',
      title: 'Pan India Festive Sale Live!',
      message: 'Diwali Dhamaka campaign is now active. Review your promotional pricing.',
      time: '2 days ago',
      read: true,
      targetScreen: 'SellerProducts',
    },
    {
      id: 'notif-5',
      type: 'order',
      title: 'Order Delivered (#ORD-97810)',
      message: 'Order was successfully delivered to Ananya Verma in Bengaluru.',
      time: '3 days ago',
      read: true,
      targetScreen: 'SellerOrders',
    },
  ];

  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState('all');

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'order', label: 'Orders' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'settlement', label: 'Payouts' },
    { id: 'system', label: 'System' },
  ];

  const filteredList = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    Alert.alert('Notifications', 'All notifications marked as read.');
  };

  const handleNotificationPress = (item) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.targetScreen) {
      navigation.navigate(item.targetScreen);
    }
  };

  const handleDeleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'order':
        return { name: 'cart', color: '#059669', bg: '#ECFDF5' };
      case 'inventory':
        return { name: 'alert-circle', color: '#D97706', bg: '#FEF3C7' };
      case 'settlement':
        return { name: 'wallet', color: '#7C3AED', bg: '#F5F3FF' };
      case 'system':
      default:
        return { name: 'notifications', color: '#2563EB', bg: '#EFF6FF' };
    }
  };

  return (
    <View style={styles.container}>
      <SellerHeader
        title="Seller Alerts"
        subtitle={`${notifications.filter((n) => !n.read).length} unread updates`}
        showBack
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerActionBtn}>
            <Text style={styles.headerActionText}>Mark All Read</Text>
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.id)}>
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const iconConfig = getIconForType(item.type);
          return (
            <TouchableOpacity
              style={[styles.notifCard, !item.read && styles.unreadCard]}
              activeOpacity={0.8}
              onPress={() => handleNotificationPress(item)}>
              <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
                <AppIcon name={iconConfig.name} size={20} color={iconConfig.color} />
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.notifTitle, !item.read && styles.unreadTitle]}>
                    {item.title}
                  </Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifMessage}>{item.message}</Text>
                <View style={styles.cardFooterRow}>
                  <Text style={styles.notifTime}>{item.time}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteNotification(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <AppIcon name="close" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No Notifications"
            description="You're all caught up with your store updates!"
          />
        }
      />
    </View>
  );
};

export default SellerNotificationsScreen;
