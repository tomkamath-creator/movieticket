import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bucketpass.app',
  appName: 'BucketPass',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
