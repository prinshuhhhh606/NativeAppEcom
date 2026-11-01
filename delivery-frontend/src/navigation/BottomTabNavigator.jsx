import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import RequestsScreen from '../screens/requests/RequestsScreen';
import ActiveDeliveriesScreen from '../screens/deliveries/ActiveDeliveriesScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import Colors from '../constants/colors';
import { useDelivery } from '../context/DeliveryContext';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  const { requests, activeDeliveries } = useDelivery();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}>
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />

      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          tabBarLabel: 'Requests',
          tabBarBadge: requests.length > 0 ? requests.length : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.danger, fontSize: 10, fontWeight: '800' },
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📥</Text>,
        }}
      />

      <Tab.Screen
        name="Deliveries"
        component={ActiveDeliveriesScreen}
        options={{
          tabBarLabel: 'Deliveries',
          tabBarBadge: activeDeliveries.length > 0 ? activeDeliveries.length : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.primary, fontSize: 10, fontWeight: '800' },
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📦</Text>,
        }}
      />

      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💰</Text>,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

