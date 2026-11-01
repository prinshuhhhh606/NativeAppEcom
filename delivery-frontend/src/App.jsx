import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { DeliveryProvider } from './context/DeliveryContext';
import AppNavigator from './navigation/AppNavigator';

export const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DeliveryProvider>
          <AppNavigator />
        </DeliveryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;

