import React from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Ignore non-critical warning logs & abort error during tunnel reconnect
LogBox.ignoreLogs([
  '[expo-av]',
  'SafeAreaView has been deprecated',
  'expo-notifications',
  'AbortError',
  'Aborted',
]);

// Context Providers
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ProductProvider } from './src/context/ProductContext';
import { CartProvider } from './src/context/CartContext';
import { OrderProvider } from './src/context/OrderContext';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Global Navigation Container Reference
export const navigationRef = createNavigationContainerRef();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <AuthProvider>
          <NotificationProvider>
            <ProductProvider>
              <CartProvider>
                <OrderProvider>
                  <AppNavigator />
                  <StatusBar style="dark" />
                </OrderProvider>
              </CartProvider>
            </ProductProvider>
          </NotificationProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
