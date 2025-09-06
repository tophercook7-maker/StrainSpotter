import { Preferences } from '@capacitor/preferences'

const KEY = 'ss_hero_image_v1'

export async function getHero() {
  try {
    const { value } = await Preferences.get({ key: KEY })
    if (value) return value
  } catch {}
  try { return localStorage.getItem(KEY) || null } catch { return null }
}

export async function setHero(dataUrl) {
  try { await Preferences.set({ key: KEY, value: dataUrl }) } catch {}
  try { localStorage.setItem(KEY, dataUrl) } catch {}
}

export async function clearHero() {
  try { await Preferences.remove({ key: KEY }) } catch {}
  try { localStorage.removeItem(KEY) } catch {}
}
