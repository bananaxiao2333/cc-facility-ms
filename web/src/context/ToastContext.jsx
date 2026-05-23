import { createContext, useContext, useCallback, useRef } from 'react';
import { OverlayToaster } from '@blueprintjs/core';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const toasterRef = useRef(null);

  const show = useCallback((message, intent = 'none', icon) => {
    toasterRef.current?.show({ message, intent, icon, timeout: 4000 });
  }, []);

  const success = useCallback((msg) => show(msg, 'success', 'tick'), [show]);
  const error = useCallback((msg) => show(msg, 'danger', 'error'), [show]);
  const warn = useCallback((msg) => show(msg, 'warning', 'warning-sign'), [show]);
  const info = useCallback((msg) => show(msg, 'primary', 'info-sign'), [show]);

  return (
    <ToastContext.Provider value={{ success, error, warn, info }}>
      {children}
      <OverlayToaster ref={toasterRef} position="bottom" />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
