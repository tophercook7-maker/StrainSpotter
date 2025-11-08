import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.strainspotter.app',
  appName: 'StrainSpotter',
  webDir: 'dist'
  // Commented out for now - load from built files instead
  // server: {
  //   url: 'http://localhost:5173',
  //   cleartext: true
  // }
};

export default config;
