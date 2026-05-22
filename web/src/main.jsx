import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ApiLoadingProvider } from './context/ApiLoadingContext';
import ApiLoadingBridge from './components/ApiLoadingBridge';
import GlobalLoading from './components/GlobalLoading';
import './index.scss';
import router from './router';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ApiLoadingProvider>
      <AuthProvider>
        <ApiLoadingBridge />
        <GlobalLoading />
        <RouterProvider router={router} />
      </AuthProvider>
    </ApiLoadingProvider>
  </StrictMode>,
);
