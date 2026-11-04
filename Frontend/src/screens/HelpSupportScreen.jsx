import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './HelpSupportScreen.styles';
import Header from '../components/Header';
import AppIcon from '../components/AppIcon';
import { Config } from '../constants/config';
import { Colors } from '../constants/colors';

const FAQS = [
  {
    q: 'How does Pan India PIN Code delivery work?',
    a: 'We partner with India’s leading logistics networks (BlueDart, Delhivery, India Post, Xpressbees) to service 19,000+ PIN codes across all 28 states and 8 union territories. Delivery time ranges between 2 to 5 business days depending on destination zone.',
  },
  {
    q: 'Is Cash on Delivery (COD) available everywhere?',
    a: 'COD is supported on most serviceable PIN codes for orders up to ₹10,000. You can check COD availability instantly by entering your 6-digit PIN code on any product page or home header.',
  },
  {
    q: 'What is the return and refund policy?',
    a: 'We offer an easy 7-day hassle-free return window on fashion, lifestyle, and decor items from the date of delivery. For damaged or defective goods, reverse pickup is scheduled at zero cost.',
  },
  {
    q: 'How are delivery charges calculated?',
    a: 'All orders with subtotal ₹499 and above enjoy FREE Pan India standard delivery. For orders below ₹499, a nominal standard fee of ₹40 applies.',
  },
];

export const HelpSupportScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const handleCall = () => {
    Linking.openURL(`tel:${Config.SUPPORT_PHONE.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Customer Care', `Call our toll-free support at ${Config.SUPPORT_PHONE}`);
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${Config.SUPPORT_EMAIL}`).catch(() => {
      Alert.alert('Email Support', `Write to us at ${Config.SUPPORT_EMAIL}`);
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Help & Support" showBack navigation={navigation} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <AppIcon name="help-circle-outline" size={40} color={Colors.primary} />
          <Text style={styles.bannerTitle}>24x7 Customer Assistance</Text>
          <Text style={styles.bannerSubtitle}>
            Have a question about your order, delivery PIN code, or returns? We are here to help.
          </Text>
        </View>

        <View style={styles.contactGrid}>
          <TouchableOpacity style={styles.contactCard} onPress={handleCall} activeOpacity={0.7}>
            <AppIcon name="call-outline" size={24} color={Colors.primary} />
            <Text style={styles.contactCardTitle}>Toll Free</Text>
            <Text style={styles.contactCardValue}>{Config.SUPPORT_PHONE}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmail} activeOpacity={0.7}>
            <AppIcon name="mail-outline" size={24} color={Colors.primary} />
            <Text style={styles.contactCardTitle}>Email Support</Text>
            <Text style={styles.contactCardValue}>{Config.SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((faq, i) => (
          <View key={i} style={styles.faqCard}>
            <Text style={styles.faqQuestion}>Q: {faq.q}</Text>
            <Text style={styles.faqAnswer}>{faq.a}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default HelpSupportScreen;

