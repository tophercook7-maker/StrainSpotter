import { Toast } from '@capacitor/toast'
export async function toast(message){
  try{
    await Toast.show({ text: message, duration:'short', position:'bottom' })
  }catch(e){
    // web fallback
    console.log('[toast]', message)
  }
}
