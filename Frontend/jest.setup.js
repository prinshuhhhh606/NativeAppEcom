/* eslint-disable no-undef */

const storage = new Map();
const mockAsyncStorage = {
  setItem: jest.fn((k, v) => {
    storage.set(k, String(v));
    return Promise.resolve(null);
  }),
  getItem: jest.fn((k) => Promise.resolve(storage.get(k) || null)),
  removeItem: jest.fn((k) => {
    storage.delete(k);
    return Promise.resolve(null);
  }),
  clear: jest.fn(() => {
    storage.clear();
    return Promise.resolve(null);
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Array.from(storage.keys()))),
  multiGet: jest.fn((keys) => Promise.resolve(keys.map((k) => [k, storage.get(k) || null]))),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([k, v]) => storage.set(k, String(v)));
    return Promise.resolve(null);
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((k) => storage.delete(k));
    return Promise.resolve(null);
  }),
  setMany: jest.fn((pairs) => {
    pairs.forEach(([k, v]) => storage.set(k, String(v)));
    return Promise.resolve(null);
  }),
  getMany: jest.fn((keys) => Promise.resolve(keys.map((k) => storage.get(k) || null))),
  removeMany: jest.fn((keys) => {
    keys.forEach((k) => storage.delete(k));
    return Promise.resolve(null);
  }),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Icon');

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  const InsetsContext = React.createContext(inset);
  const FrameContext = React.createContext(frame);

  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
    SafeAreaInsetsContext: InsetsContext,
    SafeAreaFrameContext: FrameContext,
    initialWindowMetrics: { insets: inset, frame },
  };
});

jest.mock('react-native-screens', () => {
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(() => true),
    compatibilityFlags: {},
    ScreenContainer: View,
    Screen: View,
    NativeScreen: View,
    NativeScreenContainer: View,
    NativeScreenNavigationContainer: View,
    ScreenStack: View,
    ScreenStackItem: View,
    ScreenStackHeaderConfig: View,
    ScreenStackHeaderSubview: View,
    ScreenStackHeaderLeftView: View,
    ScreenStackHeaderRightView: View,
    ScreenStackHeaderTitleView: View,
    ScreenStackHeaderCenterView: View,
    SearchBar: View,
  };
});

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props) => React.createElement(View, props),
  };
});

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
