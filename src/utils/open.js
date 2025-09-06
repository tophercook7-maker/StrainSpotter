export async function openInApp(url){
  try{
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()){
      try{
        const { Browser } = await import('@capacitor/browser')
        await Browser.open({ url })
        return
      }catch{}
    }
  }catch{}
  window.open(url, '_blank')
}
