import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const REFS_DIR = path.resolve(process.cwd(), 'refs')

async function dhashFromBuffer(buf, w=9, h=8){
  const img = sharp(buf).grayscale().resize(w, h, { fit:'fill' })
  const data = await img.raw().toBuffer()
  let bits = ''
  for(let y=0; y<h; y++){
    for(let x=0; x<w-1; x++){
      const i1 = y*w + x, i2 = y*w + x + 1
      bits += data[i1] > data[i2] ? '1' : '0'
    }
  }
  return bits
}
function hamming(a,b){
  let d=0; for(let i=0;i<Math.min(a.length,b.length);i++){ if(a[i]!==b[i]) d++ } return d
}
export async function bestMatch(buf){
  // load or build ref hashes
  const files = fs.existsSync(REFS_DIR) ? fs.readdirSync(REFS_DIR).filter(f=>/\.(png|jpe?g)$/i.test(f)) : []
  const target = await dhashFromBuffer(buf)
  let best=null
  for(const f of files){
    const b = fs.readFileSync(path.join(REFS_DIR,f))
    const h = await dhashFromBuffer(b)
    const dist = hamming(target,h)
    const score = 1 - (dist / h.length) // 0..1
    const name = path.basename(f).replace(/\.(png|jpe?g)$/i,'').replace(/[_-]+/g,' ').trim()
    if(!best || score>best.score) best = {name, score}
  }
  return best // {name, score} or null
}
