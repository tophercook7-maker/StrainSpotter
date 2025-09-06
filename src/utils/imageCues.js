export async function cuesFromDataUrl(dataUrl){
  const img = await loadImg(dataUrl)
  const { w,h,ctx } = drawToCanvas(img, 256)
  const data = ctx.getImageData(0,0,w,h).data

  let sat=0, bright=0, purple=0, orange=0, frosty=0, green=0, red=0
  for (let i=0;i<data.length;i+=4){
    const R=data[i], G=data[i+1], B=data[i+2]
    const max = Math.max(R,G,B), min = Math.min(R,G,B)
    const s = max? (max-min)/max : 0
    const v = max/255
    sat+=s; bright+=v
    const hue = rgb2h(R,G,B)
    if ((hue>270||hue<320) && s>0.25 && v>0.2) purple++
    if (hue>15 && hue<45 && s>0.35 && v>0.3) orange++
    if (G>R+10 && G>B+10) green++
    if (R>G+20 && R>B+20) red++
    if (s<0.15 && v>0.8) frosty++
  }
  const px = data.length/4
  const avg = (x)=> (x/px)
  const cues = []
  if (avg(purple)>0.06) cues.push('purple')
  if (avg(orange)>0.04) cues.push('orange hairs')
  if (avg(green)>0.22) cues.push('lush green')
  if (avg(red)>0.06) cues.push('reddish pistils')
  if (avg(frosty)>0.10) cues.push('frosty trichomes')
  if (avg(sat)>0.35 && avg(bright)>0.55) cues.push('high contrast')
  return cues
}

function loadImg(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src }) }
function drawToCanvas(img, maxSide){
  const s = Math.min(1, maxSide/Math.max(img.width,img.height))
  const w = Math.max(1, Math.round(img.width*s))
  const h = Math.max(1, Math.round(img.height*s))
  const c = document.createElement('canvas'); c.width=w; c.height=h
  const ctx = c.getContext('2d', { willReadFrequently:true })
  ctx.drawImage(img,0,0,w,h)
  return { w,h,ctx }
}
function rgb2h(R,G,B){
  const r=R/255,g=G/255,b=B/255
  const max=Math.max(r,g,b), min=Math.min(r,g,b)
  if (max===min) return 0
  let h
  if (max===r) h=(g-b)/(max-min)*60
  else if (max===g) h=(2+(b-r)/(max-min))*60
  else h=(4+(r-g)/(max-min))*60
  if (h<0) h+=360
  return h
}
