import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.setlister.app',
  appName: 'Setlister',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
