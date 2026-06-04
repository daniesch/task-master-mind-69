import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tast.schuler.ooo.app',
  appName: 'Tasks',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
};

export default config;
