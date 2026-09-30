import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../core/theme';

// Screens
import SplashScreen from '../screens/splash/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RegisterMapPickerScreen from '../screens/auth/RegisterMapPickerScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ProductListScreen from '../screens/product/ProductListScreen';
import ProductDetailScreen from '../screens/product/ProductDetailScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import OrderHistoryScreen from '../screens/order/OrderHistoryScreen';
import OrderDetailScreen from '../screens/order/OrderDetailScreen';
import OrderChatScreen from '../screens/order/OrderChatScreen';
import UploadPaymentScreen from '../screens/order/UploadPaymentScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import AddressListScreen from '../screens/address/AddressListScreen';
import AddressFormScreen from '../screens/address/AddressFormScreen';
import MapPickerScreen from '../screens/address/MapPickerScreen';

// Admin & Owner Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminProductScreen from '../screens/admin/AdminProductScreen';
import AdminOrderScreen from '../screens/admin/AdminOrderScreen';
import AdminCategoryScreen from '../screens/admin/AdminCategoryScreen';
import AdminReportScreen from '../screens/admin/AdminReportScreen';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import OwnerStockReportScreen from '../screens/owner/OwnerStockReportScreen';
import OwnerTopProductsScreen from '../screens/owner/OwnerTopProductsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { cart } = useCart();
  const cartCount = cart?.total_items ?? 0;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Beranda') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Katalog') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Keranjang') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Pesanan') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
        headerStyle: {
          backgroundColor: COLORS.white,
          ...SHADOWS.soft,
        },
        headerTitleStyle: {
          ...TYPOGRAPHY.h4,
          color: COLORS.secondary,
        },
        headerTintColor: COLORS.primary,
        headerShadowVisible: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 8,
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          ...SHADOWS.medium,
        },
      })}
    >
      <Tab.Screen
        name="Beranda"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Katalog"
        component={ProductListScreen}
        options={{ title: 'Katalog Produk' }}
      />
      <Tab.Screen
        name="Keranjang"
        component={CartScreen}
        options={{
          title: 'Keranjang Belanja',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.accent,
            color: COLORS.white,
            fontSize: 10,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
        }}
      />
      <Tab.Screen
        name="Pesanan"
        component={OrderHistoryScreen}
        options={{ title: 'Riwayat Pesanan' }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ title: 'Profil Saya' }}
      />
    </Tab.Navigator>
  );
};

import NotificationService from '../core/notificationService';

export const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  React.useEffect(() => {
    NotificationService.init();
  }, []);

  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTitleStyle: {
          ...TYPOGRAPHY.h4,
          color: COLORS.secondary,
        },
        headerTintColor: COLORS.primary,
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MapPicker"
            component={MapPickerScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RegisterMapPicker"
            component={RegisterMapPickerScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : user?.role === 'admin' ? (
        <>
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{ title: 'Dashboard Admin' }}
          />
          <Stack.Screen
            name="AdminProduct"
            component={AdminProductScreen}
            options={{ title: 'Kelola Produk' }}
          />
          <Stack.Screen
            name="AdminCategory"
            component={AdminCategoryScreen}
            options={{ title: 'Kelola Kategori' }}
          />
          <Stack.Screen
            name="AdminOrder"
            component={AdminOrderScreen}
            options={{ title: 'Kelola Pesanan' }}
          />
          <Stack.Screen
            name="AdminReport"
            component={AdminReportScreen}
            options={{ title: 'Laporan Penjualan' }}
          />
          <Stack.Screen
            name="OrderChat"
            component={OrderChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OwnerDashboard"
            component={OwnerDashboardScreen}
            options={{ title: 'Dashboard Owner' }}
          />
          <Stack.Screen
            name="OwnerStockReport"
            component={OwnerStockReportScreen}
            options={{ title: 'Laporan Stok & Terlaris' }}
          />
          <Stack.Screen
            name="OwnerTopProducts"
            component={OwnerTopProductsScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : user?.role === 'owner' ? (
        <>
          <Stack.Screen
            name="OwnerDashboard"
            component={OwnerDashboardScreen}
            options={{ title: 'Dashboard Owner' }}
          />
          <Stack.Screen
            name="OwnerStockReport"
            component={OwnerStockReportScreen}
            options={{ title: 'Laporan Stok & Terlaris' }}
          />
          <Stack.Screen
            name="OwnerTopProducts"
            component={OwnerTopProductsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OrderChat"
            component={OrderChatScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ title: 'Detail Produk' }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: 'Checkout Pesanan' }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{ title: 'Detail Pesanan' }}
          />
          <Stack.Screen
            name="OrderChat"
            component={OrderChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UploadPayment"
            component={UploadPaymentScreen}
            options={{ title: 'Upload Pembayaran' }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: 'Edit Profil' }}
          />
          <Stack.Screen
            name="AddressList"
            component={AddressListScreen}
            options={{ title: 'Daftar Alamat' }}
          />
          <Stack.Screen
            name="AddressForm"
            component={AddressFormScreen}
            options={{ title: 'Detail Alamat' }}
          />
          <Stack.Screen
            name="MapPicker"
            component={MapPickerScreen}
            options={{ title: 'Pilih Lokasi', headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
