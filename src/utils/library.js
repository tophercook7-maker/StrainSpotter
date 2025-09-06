import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'

const META='ss_library_meta_v1'
const DIR='StrainSpotter'

export async function listLibrary(){
  try{
    const { value } = await Preferences.get({key:META})
    return value ? JSON.parse(value) : []
  }catch{ return [] }
}
async function saveMeta(arr){ try{ await Preferences.set({key:META,value:JSON.stringify(arr)}) }catch{} }

export async function saveImage(dataUrl){
  const id = Date.now().toString()
  if (Capacitor.isNativePlatform()){
    const base64 = dataUrl.split(',')[1]
    await Filesystem.writeFile({ path:`${DIR}/${id}.jpg`, data:base64, directory:Directory.Documents })
    const { uri } = await Filesystem.getUri({ path:`${DIR}/${id}.jpg`, directory:Directory.Documents })
    const meta = await listLibrary(); meta.unshift({ id, uri, when: new Date().toISOString() }); await saveMeta(meta)
    return { id, uri }
  }else{
    const meta = await listLibrary(); meta.unshift({ id, dataUrl, when:new Date().toISOString() }); await saveMeta(meta)
    return { id, dataUrl }
  }
}
export async function removeImage(id){
  const meta = await listLibrary(); const m = meta.find(x=>x.id===id)
  if (m?.uri){ try{ await Filesystem.deleteFile({ path: m.uri.split('/Documents/').pop(), directory:Directory.Documents }) }catch{} }
  await saveMeta(meta.filter(x=>x.id!==id))
}
