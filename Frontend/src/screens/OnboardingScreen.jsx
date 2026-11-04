import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './OnboardingScreen.styles';
import CustomButton from '../components/CustomButton';

const SLIDES = [
  {
    emoji: '🇮🇳',
    title: 'Pan India Delivery',
    description:
      'Shop authentic products and get doorstep delivery to over 19,000+ serviceable PIN codes across all states and union territories.',
  },
  {
    emoji: '🧵',
    title: 'Authentic Indian Artisans',
    description:
      'Directly support master weavers and artisans from Varanasi, Kanchipuram, Jaipur, Moradabad, and beyond.',
  },
  {
    emoji: '🔒',
    title: 'Safe Payments & COD',
    description:
      'Pay with UPI (GPay, PhonePe, Paytm), Net Banking, Cards, or choose Cash on Delivery at your doorstep.',
  },
];

export const OnboardingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.replace('MainApp');
    }
  };

  const handleSkip = () => {
    navigation.replace('MainApp');
  };

  const slide = SLIDES[currentSlide];

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.slideContainer}>
        <View style={styles.illustrationContainer}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentSlide && styles.activeDot]}
            />
          ))}
        </View>

        <CustomButton
          title={currentSlide === SLIDES.length - 1 ? 'Start Shopping' : 'Continue'}
          onPress={handleNext}
          size="large"
          style={styles.button}
        />
      </View>
    </View>
  );
};

export default OnboardingScreen;

