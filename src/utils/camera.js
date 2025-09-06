import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
export async function takeOrPick(){
  if (Capacitor.isNativePlatform()){
    const img = await Camera.getPhoto({ resultType: CameraResultType.DataUrl, source: CameraSource.Prompt, allowEditing:false, quality:85 })
    return img.dataUrl
  }
  return new Promise(res=>{
    const i=document.createElement('input'); i.type='file'; i.accept='image/*'
    i.onchange=async()=>{ const f=i.files?.[0]; if(!f) return res(null)
      const u=URL.createObjectURL(f); const d=await toDataUrlResized(u,1024); URL.revokeObjectURL(u); res(d) }
    i.click()
  })
}
function toDataUrlResized(objectUrl, max){
  return fetch(objectUrl).then(r=>r.blob()).then(blob=>new Promise(r=>{
    const img=new Image(); img.onload=()=>{ const s=Math.min(1,max/Math.max(img.width,img.height))
      const c=document.createElement('canvas'); c.width=Math.round(img.width*s); c.height=Math.round(img.height*s)
      c.getContext('2d').drawImage(img,0,0,c.width,c.height); r(c.toDataURL('image/jpeg',0.9)) }
    img.src=objectUrl
  }))
}
