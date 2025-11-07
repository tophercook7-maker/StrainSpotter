import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.yourco.StrainSpotter',
  appName: 'StrainSpotter',
  webDir: 'dist',
  bundledWebRuntime: false,
  // No server config - use local bundled web assets
  // server: {
  //   url: 'https://strain-spotter.vercel.app',
  //   cleartext: true
  // }
}

export default config
