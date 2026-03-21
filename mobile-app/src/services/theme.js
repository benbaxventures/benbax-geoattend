import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const lightTheme = {
  dark: false,
  bg: '#f0f2f5',
  card: '#fff',
  text: '#2c3e50',
  textSecondary: '#7f8c8d',
  textMuted: '#95a5a6',
  border: '#e0e0e0',
  primary: '#1a5276',
  tabBar: '#fff',
};

export const darkTheme = {
  dark: true,
  bg: '#121212',
  card: '#1e1e1e',
  text: '#e0e0e0',
  textSecondary: '#aaa',
  textMuted: '#888',
  border: '#333',
  primary: '#2980b9',
  tabBar: '#1e1e1e',
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('darkMode').then(v => {
      if (v === 'true') setIsDark(true);
    });
  }, []);

  const toggleTheme = async () => {
    const newValue = !isDark;
    setIsDark(newValue);
    await AsyncStorage.setItem('darkMode', String(newValue));
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
