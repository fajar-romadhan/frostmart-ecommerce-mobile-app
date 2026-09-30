import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../core/theme';

export const CustomButton = ({
  title,
  onPress,
  isLoading = false,
  variant = 'primary', // primary, accent, secondary, danger, outline, outlineDanger
  style,
  textStyle,
  disabled = false,
  iconName,
  iconSize = 20,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!isLoading && !disabled && onPress) {
      onPress();
    }
  };

  const isOutline = variant === 'outline' || variant === 'outlineDanger';
  const isAccent = variant === 'accent';
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';
  const isOutlineDanger = variant === 'outlineDanger';

  const renderContent = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          size="small"
          color={isOutline ? (isOutlineDanger ? COLORS.danger : COLORS.primary) : COLORS.white}
        />
      );
    }
    return (
      <View style={styles.contentRow}>
        {iconName && (
          <Ionicons
            name={iconName}
            size={iconSize}
            color={isOutline ? (isOutlineDanger ? COLORS.danger : COLORS.primary) : COLORS.white}
            style={styles.icon}
          />
        )}
        <Text style={[
          styles.label,
          isOutline && styles.labelOutline,
          isOutlineDanger && styles.labelOutlineDanger,
          (disabled || isLoading) && styles.labelDisabled,
          textStyle,
        ]}>
          {title}
        </Text>
      </View>
    );
  };

  // Gradient button (primary or accent)
  if ((variant === 'primary' || variant === 'accent') && !disabled && !isLoading) {
    const gradientColors = isAccent
      ? [COLORS.gradientAccentStart, COLORS.gradientAccentEnd]
      : [COLORS.gradientStart, COLORS.gradientEnd];
    const shadowStyle = isAccent ? SHADOWS.accent : SHADOWS.colored;

    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          style={[styles.shadowWrap, shadowStyle]}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btn}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Non-gradient buttons
  const buttonStyle = [
    styles.btn,
    isOutline && styles.btnOutline,
    isOutlineDanger && styles.btnOutlineDanger,
    isDanger && styles.btnDanger,
    isSecondary && styles.btnSecondary,
    (disabled || isLoading) && styles.btnDisabled,
  ];

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={disabled || isLoading}
        style={buttonStyle}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: SIZES.radiusMd,
  },
  btn: {
    height: 52,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnSecondary: {
    backgroundColor: COLORS.secondary,
  },
  btnDanger: {
    backgroundColor: COLORS.danger,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  btnOutlineDanger: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  btnDisabled: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  label: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelOutline: {
    color: COLORS.primary,
  },
  labelOutlineDanger: {
    color: COLORS.danger,
  },
  labelDisabled: {
    color: COLORS.textMuted,
  },
});

export default CustomButton;
