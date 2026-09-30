import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Platform, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../core/theme';

export const CustomInput = ({
  label,
  error,
  iconName,
  secureTextEntry,
  multiline,
  numberOfLines,
  style,
  keyboardType,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hidePassword, setHidePassword] = useState(secureTextEntry);
  const inputRef = useRef(null);

  const isMultiline = !!multiline;

  // Computed keyboard type: keep email-address only on iOS
  // On all Android (including Huawei EMUI), use 'default' to prevent keyboard dismiss
  const resolvedKeyboardType = Platform.OS === 'ios'
    ? keyboardType
    : (keyboardType === 'email-address' ? 'default' : keyboardType);

  const handleContainerPress = useCallback(() => {
    // Programmatically focus the TextInput ref.
    // This bypasses EMUI's broken touch-event propagation on Huawei tablets.
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  }, [onFocus]);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  }, [onBlur]);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={handleContainerPress}
        style={[
          styles.inputContainer,
          isMultiline && styles.inputContainerMultiline,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {iconName && (
          <View style={[
            styles.iconContainer,
            isFocused && styles.iconContainerFocused,
            error && styles.iconContainerError,
            isMultiline && { marginTop: 2, alignSelf: 'flex-start' },
          ]}>
            <Ionicons
              name={iconName}
              size={18}
              color={error ? COLORS.danger : isFocused ? COLORS.primary : COLORS.textMuted}
            />
          </View>
        )}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            isMultiline && styles.inputMultiline,
          ]}
          secureTextEntry={hidePassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize={secureTextEntry ? 'none' : (keyboardType === 'email-address' ? 'none' : 'sentences')}
          autoCorrect={false}
          spellCheck={false}
          autoComplete={secureTextEntry ? 'password' : (keyboardType === 'email-address' ? 'email' : (keyboardType === 'phone-pad' ? 'tel' : 'off'))}
          textContentType={secureTextEntry ? 'password' : (keyboardType === 'email-address' ? 'emailAddress' : (keyboardType === 'phone-pad' ? 'telephoneNumber' : 'none'))}
          keyboardType={resolvedKeyboardType}
          multiline={isMultiline}
          numberOfLines={isMultiline ? (numberOfLines || 3) : undefined}
          textAlignVertical={isMultiline ? 'top' : 'center'}
          blurOnSubmit={!isMultiline}
          returnKeyType={isMultiline ? 'default' : 'next'}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setHidePassword(!hidePassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hidePassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textMuted}
              style={styles.rightIcon}
            />
          </TouchableOpacity>
        )}
      </Pressable>
      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={COLORS.danger} style={{ marginRight: 4 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputContainer: {
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputContainerMultiline: {
    height: undefined,
    minHeight: 80,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconContainerFocused: {
    backgroundColor: COLORS.primaryLight,
  },
  iconContainerError: {
    backgroundColor: COLORS.dangerLight,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: '500',
  },
  inputMultiline: {
    height: undefined,
    minHeight: 56,
    paddingTop: Platform.OS === 'ios' ? 0 : 2,
  },
  rightIcon: {
    marginLeft: 10,
    padding: 4,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FFFBFB',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default CustomInput;


