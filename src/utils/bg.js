import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { Filesystem, Directory } from '@capacitor/filesystem'
const KEY='ss_bg_v1'
const DOCS_FILE='StrainSpotter/bg.jpg'
export async function getBg(){
  const v = (await Preferences.get({key:KEY}).catch(()=>({})))?.value
  return v || null
}
export async function setBgDataUrl(dataUrl){
  if (Capacitor.isNativePlatform()){
    const base64 = dataUrl.split(',')[1]
    await Filesystem.writeFile({ path:DOCS_FILE, data:base64, directory:Directory.Documents })
    const { uri } = await Filesystem.getUri({ path:DOCS_FILE, directory:Directory.Documents })
    await Preferences.set({key:KEY, value:uri}); return uri
  } else {
    await Preferences.set({key:KEY, value:dataUrl}); return dataUrl
  }
}
export async function clearBg(){ try{ await Preferences.remove({key:KEY}) }catch{} }
