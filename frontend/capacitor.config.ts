import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.strainspotter.app',
  appName: 'StrainSpotter',
  webDir: 'dist',
  server: {
    // For hot-reload during development
    // Comment this out for production builds
    url: 'http://localhost:5173',
    cleartext: true
  }
};

export default config;
