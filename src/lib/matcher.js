export async function matchImage(file){
  await new Promise(r=>setTimeout(r, 700));
  const name = (file?.name || '').toLowerCase();
  const hints = [
    { key:'blue', strain:'Blue Dream' },
    { key:'og',   strain:'OG Kush' },
    { key:'sour', strain:'Sour Diesel' }
  ];
  const hit = hints.find(h=>name.includes(h.key));
  return { guess: hit?.strain || 'OG Kush', confidence: hit?0.82:0.61 };
}
