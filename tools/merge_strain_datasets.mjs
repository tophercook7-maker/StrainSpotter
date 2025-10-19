import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function slugify(s=''){return String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'-');}
function safeJSON(s){try{return JSON.parse(s);}catch{return null;}}
function isArray(x){return Array.isArray(x);}
function asArray(x){return isArray(x)?x:(x?[x]:[]);}

function extractArrays(obj){
  if (isArray(obj)) return obj;
  if (typeof obj==='object' && obj!==null){
    let arrs = [];
    for (const val of Object.values(obj)) arrs.push(...extractArrays(val));
    return arrs;
  }
  return [];
}

function parseFile(file){
  const ext = path.extname(file).toLowerCase();
  const txt = fs.readFileSync(file,'utf8');
  if (ext==='.json'||ext==='.jsonl'||ext==='.ndjson'){
    const parsed = safeJSON(txt);
    if (parsed) return extractArrays(parsed);
    const lines = txt.split(/\\r?\\n/).map(l=>safeJSON(l)).filter(Boolean);
    return lines.length?lines:[];
  }
  if (ext==='.txt'){
    return txt.split(/\\r?\\n/).map(l=>l.trim()).filter(Boolean).map(name=>({name}));
  }
  if (ext==='.csv'){
    const [headerLine,...lines]=txt.split(/\\r?\\n/).filter(Boolean);
    const headers=headerLine.split(',').map(h=>h.trim().replace(/^\"|\"$/g,''));
    return lines.map(line=>{
      const parts=line.match(/\"[^\"]*\"|[^,]+/g)||[];
      const obj={};
      headers.forEach((h,i)=>obj[h]=(parts[i]||'').replace(/^\"|\"$/g,''));
      return obj;
    });
  }
  return [];
}

function normalize(x){
  const name=x.name||x.strain||x.title||x.variety||'';
  if(!name)return null;
  const type=x.type||x.phenotype||x.category||null;
  const description=x.description||x.notes||null;
  const effects=asArray(x.effects||[]);
  const flavors=asArray(x.flavors||[]);
  const lineage=asArray(x.lineage||[]);
  const thc=parseFloat(x.thc)||null;
  const cbd=parseFloat(x.cbd)||null;
  return {slug:slugify(name),name,type,description,effects,flavors,lineage,thc,cbd};
}

const srcDir=process.argv[2]||path.join(process.env.HOME,'Downloads','strain_datasets');
const outFile=process.argv[3]||path.join(__dirname,'../backend/data/strain_library.json');
const files=fs.readdirSync(srcDir).filter(f=>/\.(json|jsonl|ndjson|txt|csv)$/i.test(f));

let all=[];
for(const f of files){
  const full=path.join(srcDir,f);
  const part=parseFile(full);
  console.log(`[read] ${f}: ${part.length} entries`);
  all.push(...part);
}

const merged=new Map();
for(const item of all){
  const norm=normalize(item);
  if(!norm)continue;
  if(!merged.has(norm.slug)) merged.set(norm.slug,norm);
}
fs.writeFileSync(outFile,JSON.stringify([...merged.values()],null,2));
console.log(`[done] ${merged.size} unique strains written -> ${outFile}`);
