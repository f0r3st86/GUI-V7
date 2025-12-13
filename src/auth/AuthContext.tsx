// Authentication Context for managing user authentication state
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { AccountInfo } from '@azure/msal-browser';

interface User {
  id: string;
  email: string;
  name: string;
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    if (accounts.length > 0) {
      const account = accounts[0];
      setUserFromAccount(account);
    }
    setIsLoading(false);
  }, [accounts]);

  const setUserFromAccount = (account: AccountInfo) => {
    setUser({
      id: account.localAccountId,
      email: account.username,
      name: account.name || account.username,
      // You can add custom roles from token claims here
      roles: []
    });
  };

  const login = async () => {
    try {
      setIsLoading(true);
      const response = await instance.loginPopup({
        scopes: ['User.Read', 'openid', 'profile', 'email']
      });

      if (response.account) {
        setUserFromAccount(response.account);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await instance.logoutPopup();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
