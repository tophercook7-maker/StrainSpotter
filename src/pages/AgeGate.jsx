import { approveAdult } from '../utils/agegate'
export default function AgeGate(){
  async function enter(){ await approveAdult(); window.location.replace('/') }
  return (
    <div style={{display:'grid',placeItems:'center',minHeight:'100vh',padding:'24px'}}>
      <div style={{maxWidth:420,textAlign:'center'}}>
        <h1 style={{marginBottom:8}}>StrainSpotter</h1>
        <p style={{opacity:.9,marginBottom:20}}>You must be 21+ to use this app in your region.</p>
        <img src="/hero.jpg" alt="" style={{width:'100%',borderRadius:12,marginBottom:16}}/>
        <button onClick={enter} style={{padding:'12px 16px',width:'100%'}}>I am 21 or older</button>
      </div>
    </div>
  )
}
