const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./App-JmJcCWdD.js","./vendor-DCH4KwNm.js","./react-vendor-CxfKVgr3.js","./WebLanding-CivkrsLa.js","./router-vendor-C0qkbn0g.js","./WebAppShell-Dk_UsMwu.js"])))=>i.map(i=>d[i]);
import{A as u}from"./vendor-DCH4KwNm.js";import{R as s,j as t,d as f,e as R,r as d}from"./react-vendor-CxfKVgr3.js";import{B as S,R as j,a as y}from"./router-vendor-C0qkbn0g.js";(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))c(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const l of a.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&c(l)}).observe(document,{childList:!0,subtree:!0});function n(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function c(i){if(i.ep)return;i.ep=!0;const a=n(i);fetch(i.href,a)}})();class v extends s.Component{constructor(o){super(o),this.state={hasError:!1,error:null}}static getDerivedStateFromError(o){return{hasError:!0,error:o}}componentDidCatch(o,n){console.error("ErrorBoundary caught:",o,n)}render(){return this.state.hasError?t.jsxs("div",{style:{color:"white",backgroundColor:"red",padding:32,minHeight:"100vh",fontSize:"16px"},children:[t.jsx("h2",{children:"Something went wrong."}),t.jsxs("pre",{style:{whiteSpace:"pre-wrap",wordBreak:"break-word"},children:[String(this.state.error),this.state.error?.stack]})]}):this.props.children}}const e=(...r)=>{typeof window<"u"&&console.log("[DEBUG]",new Date().toISOString(),...r)};e("=== MAIN.JSX STARTING ===");e("Window available:",typeof window<"u");e("Location:",typeof window<"u"?window.location?.href:"N/A");e("Importing React...");e("React imported:",typeof s<"u");e("ReactDOM imported:",typeof f<"u");if(typeof window<"u"){e("Setting React globally..."),window.React=s,window.ReactDOM=f,e("React set on window:",typeof window.React<"u"),typeof globalThis<"u"&&(globalThis.React=s,globalThis.ReactDOM=f,e("React set on globalThis:",typeof globalThis.React<"u"));try{Object.defineProperty(window,"React",{value:s,writable:!1,configurable:!1}),e("React property defined on window")}catch(r){e("Error defining React property:",r)}e("Final check - window.React:",typeof window.React,window.React?"EXISTS":"MISSING")}const E=s.lazy(()=>{e("=== LAZY LOADING APP ==="),e("React available:",typeof s<"u"),e("window.React available:",typeof window<"u"&&typeof window.React<"u"),typeof window<"u"&&!window.React&&(e("Setting window.React in lazy loader"),window.React=s),e("Importing App.jsx...");const r=Date.now();return u(()=>import("./App-JmJcCWdD.js").then(o=>o.d),__vite__mapDeps([0,1,2]),import.meta.url).then(o=>{const n=Date.now()-r;return e(`App.jsx loaded successfully in ${n}ms`),e("App module:",Object.keys(o)),o}).catch(o=>{throw e("ERROR loading App.jsx:",o),e("Error details:",o.message,o.stack),console.error("[CRITICAL] Failed to load App.jsx:",o),o})}),I=s.lazy(()=>u(()=>import("./WebLanding-CivkrsLa.js"),__vite__mapDeps([3,2,1,4]),import.meta.url)),k=s.lazy(()=>u(()=>import("./WebAppShell-Dk_UsMwu.js"),__vite__mapDeps([5,2,1,0,4]),import.meta.url)),C=s.lazy(()=>typeof window<"u"&&window.location.protocol!=="capacitor:"?u(()=>import("./react-vendor-CxfKVgr3.js").then(r=>r.bv),__vite__mapDeps([2,1]),import.meta.url).then(r=>({default:r.SpeedInsights})):Promise.resolve({default:()=>null}));typeof window<"u"&&(console.log("StrainSpotter main.jsx loading..."),console.log("Protocol:",window.location?.protocol),console.log("Hostname:",window.location?.hostname));const g=typeof window<"u"&&window.location.protocol==="capacitor:",w=()=>{const[r,o]=d.useState(0),[n,c]=d.useState("Initializing..."),[i,a]=d.useState("");return d.useEffect(()=>{const l=[{text:"Loading core libraries...",progress:20},{text:"Initializing React framework...",progress:40},{text:"Setting up UI components...",progress:60},{text:"Connecting to services...",progress:80},{text:"Almost ready...",progress:95}];let p=0;const m=setInterval(()=>{p<l.length?(c(l[p].text),o(l[p].progress),p++):clearInterval(m)},300),b=setInterval(()=>{a(h=>h.length>=3?"":h+".")},500);return()=>{clearInterval(m),clearInterval(b)}},[]),t.jsxs("div",{style:{width:"100%",height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg, #0a1f0a 0%, #1a3a1a 50%, #0a1f0a 100%)",color:"#C5E1A5",fontFamily:"system-ui, -apple-system, BlinkMacSystemFont, sans-serif",position:"relative",overflow:"hidden"},children:[t.jsx("div",{style:{position:"absolute",top:0,left:0,right:0,bottom:0,background:`
            radial-gradient(circle at 20% 30%, rgba(124, 179, 66, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(156, 204, 101, 0.1) 0%, transparent 50%)
          `,animation:"pulse 3s ease-in-out infinite"}}),t.jsx("style",{children:`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}),t.jsx("div",{style:{width:100,height:100,borderRadius:"50%",background:"linear-gradient(135deg, rgba(124, 179, 66, 0.3), rgba(156, 204, 101, 0.3))",border:"3px solid rgba(124, 179, 66, 0.6)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24,boxShadow:"0 0 40px rgba(124, 179, 66, 0.4)",animation:"float 2s ease-in-out infinite"},children:t.jsx("img",{src:"/hero.png?v=13",alt:"StrainSpotter",style:{width:"80%",height:"80%",objectFit:"cover",borderRadius:"50%"}})}),t.jsx("h1",{style:{fontSize:"2rem",fontWeight:700,margin:"0 0 8px 0",background:"linear-gradient(135deg, #CDDC39, #9CCC65)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},children:"StrainSpotter"}),t.jsxs("p",{style:{fontSize:"0.95rem",margin:"0 0 24px 0",opacity:.9,minHeight:"1.5em"},children:[n,i]}),t.jsx("div",{style:{width:"80%",maxWidth:300,height:4,background:"rgba(124, 179, 66, 0.2)",borderRadius:2,overflow:"hidden",marginBottom:16},children:t.jsx("div",{style:{width:`${r}%`,height:"100%",background:"linear-gradient(90deg, #7CB342, #9CCC65)",borderRadius:2,transition:"width 0.3s ease",boxShadow:"0 0 10px rgba(124, 179, 66, 0.5)"}})}),t.jsx("p",{style:{fontSize:"0.75rem",opacity:.6,textAlign:"center",maxWidth:280,margin:"16px 0 0 0",lineHeight:1.4},children:"Loading 35,000+ strain database and AI models for instant identification"})]})},x=w;function A(){return t.jsx(d.Suspense,{fallback:t.jsx(x,{}),children:t.jsx(E,{})})}function L(){return t.jsx(A,{})}function _(){return s.useEffect(()=>{if(typeof document<"u")return document.body.classList.add("web-root"),()=>{document.body.classList.remove("web-root")}},[]),t.jsx(S,{children:t.jsx(d.Suspense,{fallback:t.jsx(x,{}),children:t.jsxs(j,{children:[t.jsx(y,{path:"/",element:t.jsx(I,{})}),t.jsx(y,{path:"/app/*",element:t.jsx(k,{})})]})})})}e("=== STARTING RENDER ===");e("isCapacitor:",g);try{e("Looking for root element...");const r=document.getElementById("root");if(!r)throw new Error("Root element not found");e("Root element found:",r),e("Creating React root...");const o=R.createRoot(r);e("React root created"),e("Rendering app..."),o.render(t.jsx(d.StrictMode,{children:t.jsx(v,{children:t.jsxs(d.Suspense,{fallback:t.jsx(w,{}),children:[g?t.jsx(L,{}):t.jsx(_,{}),!g&&t.jsx(C,{})]})})})),e("App render called successfully"),setTimeout(()=>{e("Attempting to remove splash screen...");const n=document.getElementById("splash-root");n&&n.parentNode?(e("Removing splash screen"),n.style.opacity="0",n.style.transition="opacity 0.3s ease",setTimeout(()=>{n.parentNode&&(n.parentNode.removeChild(n),e("Splash screen removed"))},300)):e("Splash screen not found or already removed")},500),e("StrainSpotter rendered!")}catch(r){e("ERROR during render:",r),console.error("Failed to render app:",r),console.error("Error stack:",r.stack);const o=document.getElementById("root");o&&(o.innerHTML=`
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #0C1910;
        color: #C5E1A5;
        font-family: system-ui;
        text-align: center;
        padding: 24px;
      ">
        <h1>Loading Error</h1>
        <p style="color: #ff6b6b; margin: 16px 0;">${String(r)}</p>
        <pre style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; font-size: 12px; max-width: 90%; overflow: auto; text-align: left;">
          ${r.stack||"No stack trace"}
        </pre>
        <button onclick="location.reload()" style="
          margin-top: 16px;
          padding: 12px 24px;
          background: #7CB342;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
        ">Reload</button>
      </div>
    `);const n=document.getElementById("splash-root");n&&n.parentNode&&n.parentNode.removeChild(n)}
