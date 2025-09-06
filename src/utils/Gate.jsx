import { useEffect, useState } from 'react'
import { isAdult } from './agegate'
export default function Gate({children}){
  const [ok,setOk]=useState(null)
  useEffect(()=>{(async()=>setOk(await isAdult()))()},[])
  if(ok===null) return null
  if(!ok){ window.location.replace('/age'); return null }
  return children
}
