import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { SmoothScrollProvider } from './components/common/SmoothScrollProvider';
import ErrorBoundary from './components/common/ErrorBoundary';
import { initSecurityShield } from './utils/securityShield';
import './index.css';

// Activate Anti-Source Stealer & DevTools Protection
initSecurityShield();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <SmoothScrollProvider>
            <App />
          </SmoothScrollProvider>
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
