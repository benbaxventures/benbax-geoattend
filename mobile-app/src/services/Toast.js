import React, { useState, useCallback, useRef, useContext, createContext } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ToastContext = createContext();

const TOAST_TYPES = {
  success: { bg: '#27ae60', icon: '\u2713' },
  error: { bg: '#e74c3c', icon: '!' },
  warning: { bg: '#f39c12', icon: '\u26A0' },
  info: { bg: '#3498db', icon: 'i' },
};

function ToastMessage({ toast, onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const type = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide(toast.id));
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.toast, { backgroundColor: type.bg, opacity, transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.toastContent} onPress={() => onHide(toast.id)} activeOpacity={0.8}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{type.icon}</Text>
        </View>
        <View style={styles.textContainer}>
          {toast.title && <Text style={styles.toastTitle}>{toast.title}</Text>}
          <Text style={styles.toastMessage} numberOfLines={3}>{toast.message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const insets = useSafeAreaInsets();
  const idRef = useRef(0);

  const show = useCallback(({ type = 'info', title, message, duration = 3000 }) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev.slice(-2), { id, type, title, message, duration }]);
    return id;
  }, []);

  const hide = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback({
    success: (message, title) => show({ type: 'success', title, message }),
    error: (message, title) => show({ type: 'error', title, message, duration: 4000 }),
    warning: (message, title) => show({ type: 'warning', title, message }),
    info: (message, title) => show({ type: 'info', title, message }),
  }, [show]);

  // Make toast callable as toast.success(), toast.error(), etc.
  const contextValue = { toast, show, hide };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <View style={[styles.container, { top: insets.top + 10 }]} pointerEvents="box-none">
        {toasts.map(t => (
          <ToastMessage key={t.id} toast={t} onHide={hide} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
  },
  toastTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    fontWeight: '500',
  },
});
