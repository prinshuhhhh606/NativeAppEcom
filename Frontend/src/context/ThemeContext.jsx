import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import lightTheme from '../theme/lightTheme';
import darkTheme from '../theme/darkTheme';

const THEME_STORAGE_KEY = '@appecom_user_theme_pref';

const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
  setScheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved !== null) {
          setIsDark(saved === 'dark');
        } else if (systemScheme === 'dark') {
          setIsDark(true);
        }
      } catch (e) {
        // Fallback to light
      }
    })();
  }, [systemScheme]);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    } catch (e) {}
  };

  const setScheme = async (scheme) => {
    const next = scheme === 'dark';
    setIsDark(next);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
    } catch (e) {}
  };

  const currentTheme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        isDark,
        toggleTheme,
        setScheme,
        colors: currentTheme.colors,
        spacing: currentTheme.spacing,
        typography: currentTheme.typography,
        radius: currentTheme.radius,
        shadows: currentTheme.shadows,
        dimensions: currentTheme.dimensions,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;

