import { useEffect, useState } from 'react'
import { getBg } from './bg'

export default function ApplyBackground({fallback='/bg.jpg'}){
  const [bg,setBg] = useState(null)
  useEffect(()=>{ (async()=>{ setBg(await getBg()) })() },[])
  const url = bg || fallback
  useEffect(()=>{
    const el = document.body
    const prev = {
      bi: el.style.backgroundImage,
      bs: el.style.backgroundSize,
      bp: el.style.backgroundPosition,
      br: el.style.backgroundRepeat,
      ba: el.style.backgroundAttachment,
      bc: el.style.backgroundColor,
    }
    el.style.backgroundImage = `url("${url}")`
    el.style.backgroundSize = 'cover'
    el.style.backgroundPosition = 'center'
    el.style.backgroundRepeat = 'no-repeat'
    el.style.backgroundAttachment = 'fixed'
    el.style.backgroundColor = '#0b0b0b'
    return ()=>{ Object.assign(el.style, prev) }
  },[url])
  return null
}
