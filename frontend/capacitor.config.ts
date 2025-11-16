import type { CapacitorConfig } from '@capacitor/cli';

const useDevServer = process.env.CAP_DEV_SERVER === 'true';

const config: CapacitorConfig = {
  appId: 'com.strainspotter.app',
  appName: 'StrainSpotter',
  webDir: 'dist',
  server: useDevServer
    ? {
        url: 'http://localhost:5173',
        cleartext: true
      }
    : undefined
};

export default config;
