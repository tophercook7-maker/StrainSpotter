import { useEffect, useRef, useState } from "react"
import { fileToDataUrl } from "./utils/files"

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename || "image.png"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export default function StrainSpotterApp() {
  const [items, setItems] = useState([{ id: "demo-1", name: "Example", images: [] }])
  const [status, setStatus] = useState("Ready")
  const [preview, setPreview] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ss_items_v1")
      if (saved) setItems(JSON.parse(saved))
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem("ss_items_v1", JSON.stringify(items))
    } catch {}
  }, [items])

  async function handleAddImages(id, files) {
    const list = Array.from(files || [])
    if (list.length === 0) { setStatus("No files selected"); return }
    setStatus(`Processing ${list.length} file(s)…`)
    try {
      const dataUrls = await Promise.all(list.map(fileToDataUrl))
      setItems(prev =>
        prev.map(s => (s.id === id ? { ...s, images: [...s.images, ...dataUrls] } : s))
      )
      setStatus(`Added ${dataUrls.length} image(s)`)
      if (inputRef.current) inputRef.current.value = ""
    } catch (err) {
      setStatus(`Error: ${String(err)}`)
    }
  }

  function removeImage(itemId, index) {
    setItems(prev =>
      prev.map(s =>
        s.id !== itemId ? s : { ...s, images: s.images.filter((_, i) => i !== index) }
      )
    )
  }

  function addNote(itemId, index, text) {
    setItems(prev =>
      prev.map(s =>
        s.id !== itemId ? s : { ...s, notes: { ...(s.notes||{}), [index]: text } }
      )
    )
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "strainspotter-session.json"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: "100dvh", padding: 16, color: "#e2f7e9", background: "#062e1a" }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>StrainSpotter</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={exportJson} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #10b981", background: "transparent", color: "#e2f7e9" }}>Export Session</button>
        <div style={{ fontSize: 14, opacity: 0.85, alignSelf: "center" }}>{status}</div>
      </div>

      {items.map(item => (
        <div key={item.id} style={{ marginBottom: 24, background: "#0b2f25", padding: 12, borderRadius: 10 }}>
          <div style={{ marginBottom: 10, fontWeight: 600 }}>
            {item.name} — {item.images.length} image(s)
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onClick={e => { e.currentTarget.value = "" }}
            onChange={e => handleAddImages(item.id, e.target.files)}
            style={{ background: "#093224", color: "#e2f7e9", padding: 8, borderRadius: 8 }}
          />

          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            {item.images.map((src, i) => (
              <div key={i} style={{ display: "grid", gap: 8 }}>
                <img
                  src={src}
                  alt=""
                  onClick={() => setPreview({ src, itemId: item.id, index: i })}
                  style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 10, outline: "1px solid rgba(16,185,129,.25)", cursor: "zoom-in" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => downloadDataUrl(src, `item-${i}.png`)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #10b981", background: "transparent", color: "#e2f7e9" }}>Download</button>
                  <button onClick={() => removeImage(item.id, i)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ef4444", background: "transparent", color: "#fecaca" }}>Delete</button>
                </div>
                <input
                  defaultValue={(item.notes && item.notes[i]) || ""}
                  onBlur={(e) => addNote(item.id, i, e.target.value)}
                  placeholder="Add note"
                  style={{ background: "#093224", color: "#e2f7e9", padding: 8, borderRadius: 8, border: "1px solid rgba(16,185,129,.25)", width: 140 }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, cursor: "zoom-out" }}>
          <img src={preview.src} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12 }} />
        </div>
      )}
    </div>
  )
}
