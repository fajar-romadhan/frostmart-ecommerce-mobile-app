import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import { validateEmail } from '../../core/utils';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';

export const LoginScreen = ({ navigation }) => {
  const { login, isLoading, errorMessage } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errors, setErrors] = useState({});

  const validate = () => {
    const tempErrors = {};
    if (!email) {
      tempErrors.email = 'Email tidak boleh kosong.';
    } else if (!validateEmail(email)) {
      tempErrors.email = 'Format email tidak valid.';
    }
    if (!password) {
      tempErrors.password = 'Password tidak boleh kosong.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async () => {
    if (validate()) {
      await login(email, password);
    }
  };

  return (
    <LinearGradient
      colors={['rgba(10, 142, 217, 0.05)', '#FFFFFF']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.4 }}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name="snow" size={46} color={COLORS.white} />
              </LinearGradient>
              <Text style={styles.title}>Della Frozen Mart</Text>
              <Text style={styles.subtitle}>Selamat datang kembali! Silakan login untuk berbelanja produk frozen premium.</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={20} color={COLORS.danger} style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <CustomInput
                label="Alamat Email"
                placeholder="Masukkan email Anda"
                iconName="mail-outline"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                error={errors.email}
                keyboardType="email-address"
              />

              <CustomInput
                label="Password"
                placeholder="Masukkan password Anda"
                iconName="lock-closed-outline"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                error={errors.password}
              />

              <CustomButton
                title="Masuk Sekarang"
                onPress={handleLogin}
                isLoading={isLoading}
                style={styles.loginBtn}
                variant="primary"
              />

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>atau</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register Route Link */}
              <View style={styles.registerLinkContainer}>
                <Text style={styles.noAccountText}>Belum punya akun? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
                  <Text style={styles.registerText}>Daftar Sekarang</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SIZES.paddingLg,
    paddingVertical: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.colored,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.paddingLg,
    ...SHADOWS.medium,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.danger,
    borderWidth: 1,
    borderRadius: SIZES.radiusMd,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    flex: 1,
  },
  loginBtn: {
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginHorizontal: 12,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccountText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  registerText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },
});

export default LoginScreen;
