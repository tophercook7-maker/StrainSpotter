import React from 'react'
export default class ErrorBoundary extends React.Component{
  constructor(p){ super(p); this.state={err:null} }
  static getDerivedStateFromError(error){ return {err:error} }
  componentDidCatch(error, info){ console.error('App crashed:', error, info) }
  render(){
    if(this.state.err){
      return (
        <div style={{padding:16,color:'#eaf7ee'}}>
          <h3>Something went wrong</h3>
          <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.err)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
