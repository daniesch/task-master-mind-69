import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.96e76ba2ae74432fa5a196204669ac5d',
  appName: 'Tasks',
  webDir: 'dist',
  server: {
    url: 'https://96e76ba2-ae74-432f-a5a1-96204669ac5d.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
