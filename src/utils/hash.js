export async function imageToHash(file) {
  const img = await fileToImage(file)
  const { canvas, ctx } = makeCanvas(32, 32)
  ctx.drawImage(img, 0, 0, 32, 32)
  const data = ctx.getImageData(0, 0, 32, 32).data
  const gray = []
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2]
    gray.push(Math.round((r*0.299 + g*0.587 + b*0.114)))
  }
  const avg = gray.reduce((a,b)=>a+b,0) / gray.length
  let bits = ''
  for (const v of gray) bits += v > avg ? '1' : '0'
  let hex = ''
  for (let i = 0; i < bits.length; i += 4) hex += parseInt(bits.slice(i, i+4), 2).toString(16)
  return hex.slice(0, 16)
}
export function hamming(a, b) {
  const la = BigInt('0x' + a), lb = BigInt('0x' + b)
  let x = la ^ lb, d = 0n
  while (x) { d += x & 1n; x >>= 1n }
  return Number(d)
}
function makeCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return {canvas:c, ctx:c.getContext('2d')} }
function fileToImage(file){
  return new Promise((resolve,reject)=>{
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = reject
    img.src = url
  })
}
