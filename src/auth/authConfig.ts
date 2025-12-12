// Microsoft Authentication Library (MSAL) Configuration
// https://learn.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react

import { Configuration, PopupRequest } from '@azure/msal-browser';

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    postLogoutRedirectUri: '/',
  },
  cache: {
    cacheLocation: 'sessionStorage', // Use sessionStorage instead of localStorage for better security
    storeAuthStateInCookie: false,   // Set to true if you have issues on IE11 or Edge
  },
  system: {
    allowNativeBroker: false, // Disables WAM Broker
  }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphPhotoEndpoint: 'https://graph.microsoft.com/v1.0/me/photo/$value'
};

// Scopes you add here will be prompted for user consent during sign-in.
export const tokenRequest = {
  scopes: ['User.Read'],
};
