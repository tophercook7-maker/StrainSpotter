import { Preferences } from '@capacitor/preferences'
const KEY='ss_age_gate_v1'
export async function isAdult(){ try{ return (await Preferences.get({key:KEY})).value==='yes' }catch{ return !!localStorage.getItem(KEY) } }
export async function approveAdult(){ try{ await Preferences.set({key:KEY,value:'yes'}) }catch{ localStorage.setItem(KEY,'yes') } }
export async function resetAdult(){ try{ await Preferences.remove({key:KEY}) }catch{ localStorage.removeItem(KEY) } }
