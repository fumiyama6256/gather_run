import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import MapScreen from './src/screens/MapScreen';
import RunDetailScreen from './src/screens/RunDetailScreen';
import { supabase } from './src/lib/supabase';

export type RootStackParamList = {
  Map: undefined;
  RunDetail: {
    runId: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // アプリ起動時に匿名認証を実行
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // セッションがない場合は匿名ログイン
          const { error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.error('Anonymous sign in error:', error);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsAuthReady(true);
      }
    };

    initAuth();
  }, []);

  if (!isAuthReady) {
    // 認証準備中はローディング表示
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
