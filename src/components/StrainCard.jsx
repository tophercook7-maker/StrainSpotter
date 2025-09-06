export default function StrainCard({item, onOpen}){
  return (
    <button className="tab-card" onClick={onOpen} style={{textAlign:'left'}}>
      <div className="tab-title" style={{marginBottom:4}}>{item.name} <small style={{opacity:.8}}>• {item.type}</small></div>
      {item.parents?.length ? <div className="tab-sub">Lineage: {item.parents.join(' × ')}</div> : null}
      {item.terpenes?.length ? <div className="tab-sub">Terpenes: {item.terpenes.join(', ')}</div> : null}
      {item.thc ? <div className="tab-sub">THC: {item.thc}{item.cbd ? ` • CBD: ${item.cbd}`:''}</div> : null}
    </button>
  )
}
