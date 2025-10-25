import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './src/screens/MapScreen';
import RunDetailScreen from './src/screens/RunDetailScreen';

export type RootStackParamList = {
  Map: undefined;
  RunDetail: {
    runId: string;
    description: string;
    datetime: string;
    location_name: string | null;
    note: string | null;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Map">
          <Stack.Screen
            name="Map"
            component={MapScreen}
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="RunDetail"
            component={RunDetailScreen}
            options={{
              title: 'Run詳細',
              headerShown: true,
              presentation: 'card',
            }}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
