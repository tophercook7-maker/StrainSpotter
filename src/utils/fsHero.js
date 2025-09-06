import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const FS_FILENAME = 'strainspotter-hero.jpg'

function dataUrlToBase64(dataUrl){
  const i = dataUrl.indexOf(',')
  return i >= 0 ? dataUrl.slice(i+1) : dataUrl
}

export async function saveHeroToAppDocs(dataUrl){
  const base64 = dataUrlToBase64(dataUrl)
  await Filesystem.writeFile({
    path: FS_FILENAME,
    data: base64,
    directory: Directory.Documents
  })
  if (Capacitor.isNativePlatform()){
    const { uri } = await Filesystem.getUri({
      path: FS_FILENAME,
      directory: Directory.Documents
    })
    return { uri, path: FS_FILENAME }
  }
  // web: we don't have a native file URI; return the data URL
  return { uri: null, path: FS_FILENAME, dataUrl }
}

export async function loadHeroFromAppDocs(){
  try{
    const r = await Filesystem.readFile({
      path: FS_FILENAME,
      directory: Directory.Documents
    })
    return `data:image/jpeg;base64,${r.data}`
  }catch{
    return null
  }
}

export async function exportHeroToFiles(dataUrl){
  // Native iOS/Android: share the actual file URI
  if (Capacitor.isNativePlatform()){
    const { uri } = await saveHeroToAppDocs(dataUrl)
    // Some Android/iOS versions require 'files' not 'url'
    await Share.share({
      title: 'Save hero image',
      text: 'StrainSpotter hero image',
      files: uri ? [uri] : []
    })
    return
  }

  // Web fallback: download via anchor
  try{
    const base64 = dataUrlToBase64(dataUrl)
    const blob = await (await fetch(`data:image/jpeg;base64,${base64}`)).blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = FS_FILENAME
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000)
  }catch{/* noop */}
}
