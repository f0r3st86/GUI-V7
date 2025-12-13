# Microsoft SSO Setup Guide

Complete guide to implementing Microsoft (Azure AD) authentication for the Loan Underwriting System.

## 📋 Overview

This application uses **Microsoft Authentication Library (MSAL)** to enable secure login using your company's Microsoft accounts. This provides:

- ✅ Single Sign-On (SSO) with company credentials
- ✅ Multi-Factor Authentication (MFA) support
- ✅ No password storage or management
- ✅ Enterprise-grade security
- ✅ Compliance with banking regulations

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install @azure/msal-browser @azure/msal-react
```

### Step 2: Register App in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: `Loan Underwriting System`
   - **Supported account types**: `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI**:
     - Platform: `Single-page application (SPA)`
     - URI: `http://localhost:3000/auth/callback`
5. Click **Register**

### Step 3: Configure Authentication

After registration, configure your app:

#### API Permissions
1. Go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph**
3. Select **Delegated permissions**
4. Add these permissions:
   - `User.Read` (read user profile)
   - `openid` (OpenID Connect)
   - `profile` (basic profile)
   - `email` (email address)
5. Click **Add permissions**
6. Click **Grant admin consent** (requires admin)

#### Authentication Settings
1. Go to **Authentication**
2. Under **Implicit grant and hybrid flows**, enable:
   - ✅ Access tokens
   - ✅ ID tokens
3. Under **Advanced settings**:
   - Set **Allow public client flows** to `No`
4. Click **Save**

### Step 4: Get Your Credentials

1. Go to **Overview** page
2. Copy these values:
   - **Application (client) ID**
   - **Directory (tenant) ID**

### Step 5: Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env

# Edit .env and add your values:
VITE_AZURE_CLIENT_ID=your-client-id-from-azure
VITE_AZURE_TENANT_ID=your-tenant-id-from-azure
VITE_AZURE_REDIRECT_URI=http://localhost:3000/auth/callback
```

⚠️ **SECURITY**: Never commit `.env` to git! It's already in `.gitignore`.

### Step 6: Integrate Authentication

Update your `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { msalConfig } from './auth/authConfig';
import { AuthProvider, ProtectedRoute } from './auth';
import App from './App';
import './index.css';

// Initialize MSAL
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        </QueryClientProvider>
      </AuthProvider>
    </MsalProvider>
  </React.StrictMode>
);
```

### Step 7: Add User Profile to Header

Update your `Header` component to show logged-in user:

```typescript
import { UserProfile } from '../auth';

export const Header: React.FC = () => {
  // ... existing code ...

  return (
    <header>
      {/* ... existing header content ... */}

      {/* Add user profile in top-right corner */}
      <UserProfile />
    </header>
  );
};
```

### Step 8: Test Authentication

```bash
npm run dev
```

1. Application should redirect to login page
2. Click "Sign in with Microsoft"
3. Authenticate with your company Microsoft account
4. You should be redirected back and logged in

---

## 🏗️ Architecture

### Authentication Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1. Opens app
       ▼
┌─────────────────┐
│ ProtectedRoute  │──────► Not authenticated? Show Login
└────────┬────────┘
         │ 2. Authenticated
         ▼
┌─────────────────┐
│   Main App UI   │
└─────────────────┘
```

### Components

```
src/auth/
├── authConfig.ts       # MSAL configuration
├── AuthContext.tsx     # Auth state management
├── Login.tsx           # Login page UI
├── ProtectedRoute.tsx  # Route protection
├── UserProfile.tsx     # User dropdown menu
└── index.ts            # Exports
```

### Security Features

1. **sessionStorage** instead of localStorage
   - More secure - cleared when browser closes
   - Not vulnerable to XSS attacks

2. **Context Isolation**
   - Auth state isolated in AuthContext
   - No global variables

3. **Token Management**
   - MSAL handles token refresh automatically
   - Tokens stored securely by MSAL

4. **No Password Storage**
   - Microsoft handles all credential management
   - Your app never sees passwords

---

## 🔐 Production Setup

### 1. Create Production App Registration

Create a **separate** app registration for production:

```
Name: Loan Underwriting System - Production
Redirect URI: https://yourapp.com/auth/callback
```

**Why separate registrations?**
- Different environments (dev/staging/prod)
- Different security policies
- Easier to revoke access if needed

### 2. Update Production Environment

```bash
# .env.production
VITE_AZURE_CLIENT_ID=prod-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_REDIRECT_URI=https://yourapp.com/auth/callback
```

### 3. Configure Backend API Authentication

When you build your backend API, validate tokens:

```typescript
// Backend: Validate JWT token from frontend
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
});

async function validateToken(token: string) {
  const decoded = jwt.decode(token, { complete: true });
  const key = await client.getSigningKey(decoded.header.kid);

  return jwt.verify(token, key.getPublicKey(), {
    audience: clientId,
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`
  });
}
```

### 4. Add Role-Based Access Control (RBAC)

Configure app roles in Azure AD:

1. Go to **App registrations** → Your app → **App roles**
2. Create roles:
   - `LoanOfficer` - Can view/edit loans
   - `Underwriter` - Can approve loans
   - `Admin` - Full access
3. Assign users to roles in **Enterprise Applications**

Access roles in your app:

```typescript
// In AuthContext.tsx
const roles = account.idTokenClaims?.roles || [];

// In components
const { user } = useAuth();
if (user.roles?.includes('Admin')) {
  // Show admin features
}
```

---

## 🧪 Testing

### Test Users

Ask your Azure AD admin to create test users:

```
test-loan-officer@yourcompany.com
test-underwriter@yourcompany.com
test-admin@yourcompany.com
```

### Testing Checklist

- [ ] Login works with company account
- [ ] Logout clears session
- [ ] Token refresh works (wait 1 hour)
- [ ] MFA prompts if enabled
- [ ] Unauthorized users can't access app
- [ ] User profile shows correct info
- [ ] Session expires after browser close

---

## 🐛 Troubleshooting

### "AADSTS50011: Reply URL mismatch"

**Cause**: Redirect URI doesn't match Azure AD configuration

**Fix**:
1. Check Azure Portal → App registrations → Authentication
2. Ensure redirect URI exactly matches (including protocol and port)
3. For dev: `http://localhost:3000/auth/callback`

### "AADSTS65001: User consent required"

**Cause**: App permissions not granted

**Fix**:
1. Azure Portal → App registrations → API permissions
2. Click "Grant admin consent for [Your Organization]"

### Login popup blocked

**Cause**: Browser blocks popups

**Fix**:
1. Allow popups for `login.microsoftonline.com`
2. Or use redirect flow instead of popup (edit authConfig.ts)

### "Network Error" during login

**Cause**: Client ID or Tenant ID incorrect

**Fix**:
1. Verify `.env` values match Azure Portal
2. Check browser console for detailed error
3. Ensure no typos in IDs

---

## 📚 Additional Resources

- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Azure AD App Registration Guide](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Identity Platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL React Samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples)

---

## 🔒 Security Best Practices

1. **Never commit secrets**
   - `.env` is in `.gitignore`
   - Use environment variables for all config

2. **Use separate app registrations**
   - Different for dev/staging/production
   - Easier to manage and revoke

3. **Minimize permissions**
   - Only request permissions you need
   - User.Read is usually sufficient

4. **Enable MFA**
   - Enforce MFA in Azure AD
   - Adds extra layer of security

5. **Monitor auth logs**
   - Check Azure AD sign-in logs regularly
   - Alert on suspicious activity

6. **Keep dependencies updated**
   - Regularly run `npm audit`
   - Update MSAL packages when available

---

## 📝 Next Steps

After authentication is working:

1. **Add audit logging**
   - Log who accessed what data
   - Store logs securely

2. **Implement RBAC**
   - Define roles in Azure AD
   - Restrict features based on roles

3. **Add API authentication**
   - Protect backend with same tokens
   - Validate tokens on every request

4. **Set up monitoring**
   - Track failed login attempts
   - Alert on anomalies

5. **Compliance review**
   - Ensure GLBA compliance
   - Document security controls
   - Regular security audits
