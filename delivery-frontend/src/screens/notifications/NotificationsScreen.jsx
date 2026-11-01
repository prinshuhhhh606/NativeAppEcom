import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../../components/common/CustomHeader';
import Colors from '../../constants/colors';
import { deliveryService } from '../../services/deliveryService';

export const NotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await deliveryService.getNotifications();
      setNotifications(res.data?.notifications || res.notifications || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Fleet Alerts & Offers" showBack navigation={navigation} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNotifications} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}>
        {notifications.map((n) => (
          <View key={n.id} style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{n.title}</Text>
              <Text style={styles.time}>{n.time}</Text>
            </View>
            <Text style={styles.message}>{n.message}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  time: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  message: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});

export default NotificationsScreen;

