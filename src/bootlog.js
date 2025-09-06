(function(){
  const box = document.createElement('div');
  box.id = 'bootlog';
  box.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;background:rgba(20,20,20,.9);color:#fafafa;font:12px/1.4 -apple-system,system-ui,Segoe UI,Roboto,Arial;padding:8px;border-radius:8px;z-index:99999;max-height:40vh;overflow:auto;display:none';
  document.addEventListener('DOMContentLoaded', ()=>document.body.appendChild(box));
  function log(msg){ box.style.display='block'; box.innerHTML += msg + '<br/>'; }
  window.addEventListener('error', e=>log('Error: '+(e.error?.stack||e.message)), true);
  window.addEventListener('unhandledrejection', e=>log('Promise: '+(e.reason?.stack||e.reason)), true);
  log('Bootlog active…');
})();
