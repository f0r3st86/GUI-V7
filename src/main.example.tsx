// Example main.tsx with Microsoft SSO integrated
// Copy this to main.tsx after installing @azure/msal-browser and @azure/msal-react

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { msalConfig } from './auth/authConfig';
import { AuthProvider, ProtectedRoute } from './auth';
import App from './App';
import './index.css';

// ==================== MSAL INITIALIZATION ====================
// Initialize Microsoft Authentication Library
const msalInstance = new PublicClientApplication(msalConfig);

// Optional: Handle redirect promise (for redirect flow)
msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().catch((error) => {
    console.error('Redirect error:', error);
  });
});

// ==================== REACT QUERY SETUP ====================
// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ==================== APP RENDER ====================
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 1. MSAL Provider - Handles Microsoft authentication */}
    <MsalProvider instance={msalInstance}>
      {/* 2. Auth Provider - Manages auth state */}
      <AuthProvider>
        {/* 3. React Query Provider - Handles data fetching */}
        <QueryClientProvider client={queryClient}>
          {/* 4. Protected Route - Shows login if not authenticated */}
          <ProtectedRoute>
            {/* 5. Main App - Only shown to authenticated users */}
            <App />
          </ProtectedRoute>
        </QueryClientProvider>
      </AuthProvider>
    </MsalProvider>
  </React.StrictMode>
);

// ==================== NOTES ====================
// 1. Order matters! MSAL must wrap Auth, which wraps Query, which wraps App
// 2. ProtectedRoute will show Login.tsx if user is not authenticated
// 3. Once authenticated, user sees the full App
// 4. User profile can be accessed anywhere via useAuth() hook
// 5. MSAL handles token refresh automatically
