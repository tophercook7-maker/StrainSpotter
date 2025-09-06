import { createContext, useContext, useMemo, useState } from 'react'

const Ctx = createContext(null)
const LIB_KEY = 'ss_library_v1'

export function StoreProvider({ children }){
  const [lastPhoto, setLastPhoto] = useState(null)
  const [library, setLibrary] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LIB_KEY)||'[]') } catch { return [] }
  })

  const saveLibrary = (items) => {
    setLibrary(items)
    try { localStorage.setItem(LIB_KEY, JSON.stringify(items)) } catch {}
  }
  const addToLibrary = (entry) =>
    saveLibrary([{ id: crypto.randomUUID(), ts: Date.now(), ...entry }, ...library])
  const removeFromLibrary = (id) => saveLibrary(library.filter(x => x.id !== id))
  const clearLibrary = () => saveLibrary([])

  const value = useMemo(()=>({
    lastPhoto, setLastPhoto,
    library, addToLibrary, removeFromLibrary, clearLibrary
  }),[lastPhoto, library])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useStore = () => useContext(Ctx)
