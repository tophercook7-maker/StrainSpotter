import React, { useEffect, useRef, useState } from "react";

const Badge = ({ children }) => (
  <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'#DCFCE7',color:'#065F46',border:'1px solid #BBF7D0',borderRadius:999,padding:'4px 10px',fontSize:12,fontWeight:600}}>{children}</span>
);

const Card = ({ title, subtitle, right, children }) => (
  <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:16,boxShadow:'0 1px 6px rgba(0,0,0,0.04)',padding:20}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12}}>
      <div>
        <div style={{fontSize:18,fontWeight:600}}>{title}</div>
        {subtitle && <div style={{fontSize:14,color:'#475569',marginTop:4}}>{subtitle}</div>}
      </div>
      {right}
    </div>
    <div style={{marginTop:16}}>{children}</div>
  </div>
);

const LS_DATA = "StrainSpotter.v1.gallery";

function loadData() {
  try {
    const raw = localStorage.getItem(LS_DATA);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveData(items) { localStorage.setItem(LS_DATA, JSON.stringify(items)); }

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function ensureClip() {
  const { pipeline, env } = await import("@xenova/transformers");
  env.useBrowserCache = true;
  env.allowRemoteModels = true;
  const extractor = await pipeline("feature-extraction", "Xenova/clip-vit-base-patch16");
  return extractor;
}

async function imageToEmbedding(extractor, imgEl) {
  const out = await extractor(imgEl, { pooling: "mean", normalize: true });
  const data = out?.data ?? out;
  const f32 = data instanceof Float32Array ? data : new Float32Array(data);
  let norm = 0; for (let i = 0; i < f32.length; i++) norm += f32[i]*f32[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < f32.length; i++) f32[i] /= norm;
  return f32;
}

function cosine(a, b) {
  let dot = 0; for (let i = 0; i < a.length; i++) dot += a[i]*b[i];
  return dot;
}

function meanEmbedding(embs) {
  if (!embs?.length) return null;
  const len = embs[0].length;
  const out = new Float32Array(len);
  for (const e of embs) for (let i = 0; i < len; i++) out[i] += e[i];
  for (let i = 0; i < len; i++) out[i] /= embs.length;
  let norm = 0; for (let i=0;i<len;i++) norm += out[i]*out[i];
  norm = Math.sqrt(norm)||1; for (let i=0;i<len;i++) out[i]/=norm;
  return out;
}

async function ocrImage(imgEl) {
  try {
    const Tesseract = await import("tesseract.js");
    const res = await Tesseract.recognize(imgEl, "eng");
    return res?.data?.text || "";
  } catch { return ""; }
}

export default function StrainSpotterApp() {
  const [ageOk, setAgeOk] = useState(false);
  const [view, setView] = useState("home");
  const [items, setItems] = useState(() => loadData());
  useEffect(() => saveData(items), [items]);

  const BackButton = () => (
    <button onClick={()=>setView("home")} style={{position:'fixed',top:12,left:12,padding:8,borderRadius:999,background:'#fff',border:'1px solid #E2E8F0',boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>✕</button>
  );

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(#ECFDF5,#fff)',color:'#0f172a',padding:24}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16}}>
          <div>
            <div style={{fontSize:28,fontWeight:700}}>StrainSpotter</div>
            <div style={{fontSize:14,color:'#475569',marginTop:4}}>On-device strain matching with CLIP + optional OCR. No server required.</div>
          </div>
          <Badge>Local • Private</Badge>
        </header>

        {!ageOk ? (
          <AgeGate onContinue={() => setAgeOk(true)} />
        ) : (
          <>
            {view === "home" && (
              <div style={{marginTop:24,display:'grid',gap:12}}>
                <DashboardButton
                  title="Scan & Identify"
                  desc="Use your camera to classify a photo with on-device AI"
                  onClick={()=>setView("classify")}
                />
                <DashboardButton
                  title="My Gallery"
                  desc="Manage your strains and reference images"
                  onClick={()=>setView("gallery")}
                />
                <DashboardButton
                  title="Import / Export"
                  desc="Backup or share your local dataset"
                  onClick={()=>setView("dataset")}
                />
              </div>
            )}

            {view !== "home" && <BackButton />}

            <section style={{marginTop:24}}>
              {view === "classify" && <Classifier items={items} />}
              {view === "gallery" && <Gallery items={items} setItems={setItems} />}
              {view === "dataset" && <ImportExport items={items} setItems={setItems} />}
            </section>
          </>
        )}

        <footer style={{marginTop:32,fontSize:12,color:'#64748b'}}>
          <div>First run downloads model weights to your browser cache; later runs are fast.</div>
          <div>Educational use only; no sales or delivery.</div>
        </footer>
      </div>
    </div>
  );
}

function DashboardButton({ title, desc, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'block',width:'100%',textAlign:'left',
      background:'transparent',border:0,padding:14,
      borderRadius:12
    }}>
      <div>
        <div style={{fontSize:16,fontWeight:700}}>{title}</div>
        <div style={{fontSize:13,color:'#475569',marginTop:4}}>{desc}</div>
      </div>
    </button>
  );
}

function AgeGate({ onContinue }) {
  const [checked, setChecked] = useState(false);
  return (
    <Card title="Age Confirmation" subtitle="You must be 21+ to proceed in the U.S.">
      <label style={{display:'flex',alignItems:'center',gap:8,fontSize:14}}>
        <input type="checkbox" checked={checked} onChange={(e)=>setChecked(e.target.checked)} />
        I am 21 years of age or older.
      </label>
      <div style={{fontSize:12,color:'#64748b',marginTop:8}}>This app is educational only and does not facilitate the sale or delivery of cannabis. Accuracy is not guaranteed.</div>
      <button onClick={onContinue} disabled={!checked} style={{marginTop:12,padding:'8px 14px',borderRadius:12,background:'#047857',color:'#fff',border:0,opacity: checked?1:0.6}}>Continue</button>
    </Card>
  );
}

function Gallery({ items, setItems }) {
  const imgRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const addStrain = (name, type, notes) => {
    const id = (name||"Unnamed").toLowerCase().replace(/[^a-z0-9]+/g,"-") + "-" + Math.random().toString(36).slice(2,6);
    setItems(prev => [{ id, name, type, notes, images: [], embs: []}, ...prev]);
  };
  const removeStrain = (id) => setItems(prev => prev.filter(x => x.id !== id));

  const addImageToStrain = async (id, file) => {
    setBusy(true);
    try {
      const extractor = await ensureClip();
      const url = URL.createObjectURL(file);
      const img = imgRef.current; img.src = url;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  const emb = await imageToEmbedding(extractor, img);
  URL.revokeObjectURL(url);
  const dataUrl = await fileToDataUrl(file);
  setItems(prev => prev.map(s => s.id===id ? { ...s, images: [...s.images, dataUrl], embs: [...s.embs, Array.from(emb)] } : s));
    } finally { setBusy(false); }
  };

  return (
    <Card title="My Gallery" subtitle="Add multiple images per strain for better matching." right={<Badge>{items.length} strains</Badge>}>
      <img ref={imgRef} alt="hidden" style={{display:'none'}} />
      <AddStrainForm onAdd={addStrain} />
      <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
        {items.map(s => (
          <div key={s.id} style={{border:'1px solid #E2E8F0',borderRadius:12,overflow:'hidden',background:'#fff'}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:12}}>
              <div>
                <div style={{fontWeight:600}}>{s.name}</div>
                <div style={{fontSize:12,color:'#64748b'}}>{s.type || "—"}</div>
              </div>
              <button onClick={()=>removeStrain(s.id)} style={{fontSize:12,color:'#64748b'}}>Remove</button>
            </div>
            {s.images?.length ? (
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,padding:12,paddingTop:0}}>
                {s.images.map((src,i)=>(<img key={i} src={src} alt="ref" style={{height:80,width:'100%',objectFit:'cover',borderRadius:6}}/>))}
              </div>
            ) : (<div style={{fontSize:12,color:'#64748b',padding:'0 12px 12px'}}>No images yet.</div>)}
            <div style={{padding:12}}>
              <AddImageButton busy={busy} onPick={(file)=>addImageToStrain(s.id,file)} />
              {s.notes && <div style={{fontSize:12,color:'#475569',marginTop:8,whiteSpace:'pre-line'}}>{s.notes}</div>}
            </div>
          </div>
        ))}
        {!items.length && <div style={{fontSize:14,color:'#64748b'}}>No strains yet. Add a few before classifying.</div>}
      </div>
    </Card>
  );
}

function AddStrainForm({ onAdd }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:8}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Strain name (e.g., Blue Dream)"
        style={{padding:'10px 12px',borderRadius:12,border:'1px solid #E2E8F0'}}/>
      <input value={type} onChange={e=>setType(e.target.value)} placeholder="Type (Indica/Sativa/Hybrid)"
        style={{padding:'10px 12px',borderRadius:12,border:'1px solid #E2E8F0'}}/>
      <button onClick={()=>{ if(!name.trim()) return alert("Name required"); onAdd(name.trim(), type.trim(), notes.trim()); setName(""); setType(""); setNotes(""); }}
        style={{padding:'10px 12px',borderRadius:12,background:'#0f172a',color:'#fff',border:0}}>Add Strain</button>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes (effects, aroma, grower, batch, etc.)"
        style={{gridColumn:'1/-1',padding:'10px 12px',borderRadius:12,border:'1px solid #E2E8F0',minHeight:70}}/>
    </div>
  );
}

function AddImageButton({ busy, onPick }) {
  const inputRef = useRef(null);
  return (
    <>
  <input ref={inputRef} type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) onPick(f); e.target.value=''; }} style={{display:'none'}} />
      <button onClick={()=>inputRef.current?.click()} disabled={busy} style={{padding:'8px 14px',borderRadius:12,background:'#047857',color:'#fff',border:0,opacity: busy?0.6:1}}>
        {busy? "Adding…":"Add Image"}
      </button>
    </>
  );
}

function Classifier({ items }) {
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [preds, setPreds] = useState([]);
  const [ocrText, setOcrText] = useState("");
  const imgRef = useRef(null);

  const onPick = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setFileName(f.name); setErr(null); setPreds([]); setOcrText("");
    const url = URL.createObjectURL(f); const img = imgRef.current; img.src = url; img.onload = () => URL.revokeObjectURL(url);
  };

  const onClassify = async () => {
    try {
      if (!imgRef.current?.src) throw new Error("Choose a photo first.");
      if (!items.length) throw new Error("Add or import some reference strains first.");
      setBusy(true); setErr(null); setPreds([]);

      const extractor = await ensureClip();
      const qEmb = await imageToEmbedding(extractor, imgRef.current);

      const scored = items.map(s => {
        const vectors = (s.embs || []).map(arr => new Float32Array(arr)).filter(v=>v && v.length);
        const mean = meanEmbedding(vectors);
        const score = mean ? cosine(qEmb, mean) : -1;
        return { id: s.id, name: s.name, type: s.type, notes: s.notes, score, count: vectors.length };
      }).filter(x => x.score >= -1);

      scored.sort((a,b)=> b.score - a.score);

      const text = await ocrImage(imgRef.current);
      setOcrText(text?.trim() || "");
      const textLower = (text||"").toLowerCase();
      for (const s of scored) {
        if (textLower.includes((s.name||"").toLowerCase())) s.score += 0.05;
      }

      const top = scored.slice(0,5).map((s)=> ({...s, confidence: Math.round(((s.score+1)/2)*100)}));
      setPreds(top);
    } catch (e) {
      setErr(String(e?.message||e));
    } finally { setBusy(false); }
  };

  return (
    <Card title="Classify Photo" subtitle="Upload a bud/plant/label photo to find nearest strains." right={<Badge>{items.length} strains</Badge>}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div>
          <label style={{display:'inline-flex',alignItems:'center',justifyContent:'center',padding:'8px 14px',border:'1px solid #E2E8F0',borderRadius:12,background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.04)',cursor:'pointer'}}>
            <input type="file" accept="image/*" onChange={onPick} style={{display:'none'}} />
            <span style={{fontSize:14}}>Choose Photo</span>
          </label>
          <span style={{marginLeft:8,fontSize:12,color:'#64748b',verticalAlign:'middle'}}>{fileName || "No file selected"}</span>
          <div style={{marginTop:12,aspectRatio:'16/9',background:'#F1F5F9',border:'1px solid #E2E8F0',borderRadius:12,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <img ref={imgRef} alt="preview" style={{maxHeight:'100%',maxWidth:'100%',objectFit:'contain'}} />
          </div>
          <button onClick={onClassify} disabled={busy} style={{marginTop:12,width:'100%',padding:'10px 12px',borderRadius:12,background:'#0f172a',color:'#fff',border:0,opacity: busy?0.6:1}}>
            {busy? "Identifying…" : "Identify Strain"}
          </button>
          {err && <div style={{marginTop:8,fontSize:12,color:'#b91c1c',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:8}}>{err}</div>}
        </div>
        <div>
          <div style={{fontWeight:600}}>Top Matches</div>
          <ul style={{marginTop:8,display:'grid',gap:8,listStyle:'none',padding:0}}>
            {preds.map((p,i)=> (
              <li key={p.id} style={{border:'1px solid #E2E8F0',borderRadius:12,padding:12}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:12,padding:'2px 6px',borderRadius:8,background:'#F1F5F9',border:'1px solid #E2E8F0'}}>#{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
                    <div style={{fontSize:12,color:'#64748b'}}> {p.type || "—"} • refs: {p.count}</div>
                  </div>
                  <div style={{fontSize:14,fontWeight:700}}>{p.confidence}%</div>
                </div>
                {p.notes && <div style={{fontSize:12,color:'#475569',marginTop:8,whiteSpace:'pre-line'}}>{p.notes}</div>}
              </li>
            ))}
          </ul>
          {!preds.length && <div style={{fontSize:14,color:'#64748b',marginTop:8}}>No results yet.</div>}
          {ocrText && (
            <div style={{marginTop:12}}>
              <div style={{fontSize:12,fontWeight:600}}>OCR (label text):</div>
              <pre style={{fontSize:12,color:'#475569',background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:8,padding:8,maxHeight:140,overflow:'auto',whiteSpace:'pre-wrap'}}>{ocrText}</pre>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ImportExport({ items, setItems }) {
  const onExport = () => {
    const blob = new Blob([JSON.stringify(items||[], null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'strainspotter_dataset.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const onImport = (e) => {
    const f = e.target.files?.[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { const data = JSON.parse(reader.result); if(Array.isArray(data)) setItems(data); }
      catch {}
    };
    reader.readAsText(f);
    e.target.value = '';
  };
  return (
    <Card title="Import / Export" subtitle="Backup or share your dataset (JSON).">
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button onClick={onExport} style={{padding:'8px 14px',borderRadius:12,background:'#0f172a',color:'#fff',border:0}}>Export JSON</button>
        <label style={{padding:'8px 14px',borderRadius:12,border:'1px solid #E2E8F0',background:'#fff',cursor:'pointer'}}>
          Import JSON
          <input type="file" accept="application/json" onChange={onImport} style={{display:'none'}}/>
        </label>
      </div>
    </Card>
  );
}
