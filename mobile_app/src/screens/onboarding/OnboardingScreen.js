import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import { CustomButton } from '../../components/CustomButton';

const { width } = Dimensions.get('window');

export const OnboardingScreen = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef(null);

  const slides = [
    {
      title: 'Katalog Digital',
      desc: 'Temukan berbagai macam pilihan makanan beku berkualitas tinggi langsung dari smartphone Anda.',
      icon: 'search-outline',
    },
    {
      title: 'Pemesanan Praktis',
      desc: 'Pesan dari rumah, pilih metode antar atau ambil di toko secara langsung tanpa antre.',
      icon: 'bag-handle-outline',
    },
    {
      title: 'Pembayaran Aman',
      desc: 'Metode pembayaran fleksibel dengan Transfer Bank, QRIS, maupun bayar di tempat (COD).',
      icon: 'card-outline',
    },
  ];

  const handleNext = () => {
    if (currentPage === slides.length - 1) {
      navigation.replace('Login');
    } else {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({ x: nextPage * width, animated: true });
      setCurrentPage(nextPage);
    }
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  return (
    <LinearGradient
      colors={['#F0F4F8', '#FFFFFF']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.3 }}
    >
      <SafeAreaView style={styles.container}>
        {/* Skip button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Lewati</Text>
          </TouchableOpacity>
        </View>

        {/* Slide Content */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.slidesContainer}
        >
          {slides.map((slide, index) => (
            <View key={index} style={styles.slide}>
              <View style={styles.iconOuterCircle}>
                <View style={styles.iconContainer}>
                  <Ionicons name={slide.icon} size={70} color={COLORS.primary} />
                </View>
              </View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.desc}>{slide.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Footer controls */}
        <View style={styles.footer}>
          {/* Indicators */}
          <View style={styles.indicatorContainer}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentPage === index ? styles.activeIndicator : null,
                ]}
              />
            ))}
          </View>

          {/* Action Button */}
          <CustomButton
            title={currentPage === slides.length - 1 ? 'Mulai' : 'Lanjut'}
            onPress={handleNext}
            style={styles.button}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SIZES.paddingLg,
    paddingTop: 16,
    alignItems: 'flex-end',
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingLg * 1.5,
  },
  iconOuterCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(10, 142, 217, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  desc: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingLg,
    paddingBottom: 36,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    marginRight: 8,
  },
  activeIndicator: {
    backgroundColor: COLORS.primary,
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: 130,
  },
});

export default OnboardingScreen;
