import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

// Polyfills for React Native (モバイルのみ)
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
  require('react-native-get-random-values');
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
