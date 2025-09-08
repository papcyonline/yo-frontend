import React, { createContext, useContext, useState, ReactNode } from 'react';
import CustomAlert, { AlertType } from '../components/common/CustomAlert';
import Toast, { ToastType, ToastPosition } from '../components/common/Toast';
import SimpleToast, { SimpleToastType } from '../components/common/SimpleToast';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  autoHide?: boolean;
  autoHideDelay?: number;
  showIcon?: boolean;
  customIcon?: string;
}

interface ToastOptions {
  type?: ToastType;
  message: string;
  position?: ToastPosition;
  duration?: number;
  action?: {
    text: string;
    onPress: () => void;
  };
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
  showToast: (options: ToastOptions | string) => void;
  hideToast: () => void;
  // Quick methods for common alerts
  showSuccess: (title: string, message?: string, buttons?: AlertButton[]) => void;
  showError: (title: string, message?: string, buttons?: AlertButton[]) => void;
  showWarning: (title: string, message?: string, buttons?: AlertButton[]) => void;
  showInfo: (title: string, message?: string, buttons?: AlertButton[]) => void;
  showNetworkError: (message?: string) => void;
  // Quick toast methods
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    options: AlertOptions;
  }>({
    visible: false,
    options: { title: '' },
  });

  const [toastState, setToastState] = useState<{
    visible: boolean;
    options: ToastOptions;
  }>({
    visible: false,
    options: { message: '' },
  });

  const [simpleToastState, setSimpleToastState] = useState<{
    visible: boolean;
    message: string;
    type: SimpleToastType;
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showAlert = (options: AlertOptions) => {
    setAlertState({
      visible: true,
      options: {
        buttons: [{ text: 'OK', style: 'default' }],
        ...options,
      },
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const showToast = (options: ToastOptions | string) => {
    const toastOptions = typeof options === 'string' 
      ? { message: options } 
      : options;
    
    setToastState({
      visible: true,
      options: toastOptions,
    });
  };

  const hideToast = () => {
    setToastState(prev => ({ ...prev, visible: false }));
  };

  // Quick alert methods
  const showSuccess = (title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert({
      type: 'success',
      title,
      message,
      buttons: buttons || [{ text: 'Great!', style: 'default' }],
    });
  };

  const showError = (title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert({
      type: 'error',
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
  };

  const showWarning = (title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert({
      type: 'warning',
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
  };

  const showInfo = (title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert({
      type: 'info',
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
  };

  const showNetworkError = (message?: string) => {
    showAlert({
      type: 'network',
      title: 'Connection Failed',
      message: message || 'Please check your internet connection and try again.',
      buttons: [
        { text: 'Retry', style: 'default' },
        { text: 'Cancel', style: 'cancel' }
      ],
    });
  };

  // Simple toast methods (WhatsApp-style)
  const success = (message: string) => {
    setSimpleToastState({ visible: true, message, type: 'success' });
  };

  const error = (message: string) => {
    setSimpleToastState({ visible: true, message, type: 'error' });
  };

  const warning = (message: string) => {
    setSimpleToastState({ visible: true, message, type: 'error' });
  };

  const info = (message: string) => {
    setSimpleToastState({ visible: true, message, type: 'info' });
  };

  const hideSimpleToast = () => {
    setSimpleToastState(prev => ({ ...prev, visible: false }));
  };

  const contextValue: AlertContextType = {
    showAlert,
    hideAlert,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNetworkError,
    success,
    error,
    warning,
    info,
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      
      <CustomAlert
        visible={alertState.visible}
        {...alertState.options}
        onDismiss={hideAlert}
      />
      
      <Toast
        visible={toastState.visible}
        {...toastState.options}
        onHide={hideToast}
      />
      
      <SimpleToast
        visible={simpleToastState.visible}
        message={simpleToastState.message}
        type={simpleToastState.type}
        onHide={hideSimpleToast}
      />
    </AlertContext.Provider>
  );
};

export default AlertProvider;