// API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const config = {
  apiUrl: API_URL,
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
};


