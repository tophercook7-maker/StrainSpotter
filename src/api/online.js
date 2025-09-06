export async function searchOnlineByName(name){
  const q = encodeURIComponent(name + ' cannabis strain genetics cannabinoids')
  const leafly = 'https://www.leafly.com/search?q=' + q
  const seedfinder = 'https://en.seedfinder.eu/search/?q=' + encodeURIComponent(name)
  return [
    { label: 'Leafly', url: leafly },
    { label: 'SeedFinder', url: seedfinder }
  ]
}
