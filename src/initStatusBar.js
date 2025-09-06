import { StatusBar } from '@capacitor/status-bar'
export async function initStatusBar(){
  try {
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setStyle({ style: 'LIGHT' })
  } catch {}
}
