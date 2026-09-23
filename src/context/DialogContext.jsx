import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { soundFx } from '../utils/soundFx';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger' // 'danger' | 'warning' | 'primary' | 'success'
  }) => {
    soundFx.modalOpen();
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        variant
      });
    });
  }, []);

  const prompt = useCallback(({
    title = 'Input Required',
    message = 'Please enter a value:',
    defaultValue = '',
    placeholder = 'Type here...',
    confirmText = 'Submit',
    cancelText = 'Cancel',
    variant = 'primary'
  }) => {
    soundFx.modalOpen();
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        type: 'prompt',
        title,
        message,
        defaultValue,
        placeholder,
        confirmText,
        cancelText,
        variant,
        inputValue: defaultValue
      });
    });
  }, []);

  const alert = useCallback(({
    title = 'Notice',
    message = '',
    confirmText = 'OK',
    variant = 'info'
  }) => {
    soundFx.modalOpen();
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        type: 'alert',
        title,
        message,
        confirmText,
        variant
      });
    });
  }, []);

  const handleResolve = useCallback((value) => {
    soundFx.click();
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
    setDialogState(null);
  }, []);

  const handleReject = useCallback(() => {
    soundFx.modalClose();
    if (resolverRef.current) {
      resolverRef.current(dialogState?.type === 'prompt' ? null : false);
      resolverRef.current = null;
    }
    setDialogState(null);
  }, [dialogState]);

  return (
    <DialogContext.Provider value={{ confirm, prompt, alert, dialogState, setDialogState, handleResolve, handleReject }}>
      {children}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
