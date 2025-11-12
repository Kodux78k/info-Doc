/* ============================================================
   KOBLLUX — Super Patch MAP_RGX_v2.mjs  (ESM / module)
   Markdown Action Protocol + Regex Heavy Inline Engine
   ============================================================ */

const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
const log=(...a)=>console.log('[MAP_RGX_v2.mjs]',...a);
const safeToast=(m)=>{ try{ if(window.toast) window.toast(m); else log(m);}catch{ log(m);} };

/* Exported applyRGX */
export function applyRGX(root=document){
  InlineEngine(root);
  ButtonEngine(root);
  CalloutEngine(root);
  log('applyRGX() executed');
}

/* Optional: default export */
export default { applyRGX };

/* ===== RenderBus soft attach (does not override) ===== */
function ensureBus(){
  const bus = window.RenderBus || (window.RenderBus = { _:{}, on(e,f){ (this._[e]=this._[e]||[]).push(f); }, emit(e,p){ (this._[e]||[]).forEach(fn=>{ try{ fn(p);}catch(err){ console.warn('RenderBus fn error', err);} }); } });
  return bus;
}
ensureBus();

/* ===== BUTTON ENGINE ===== */
function ButtonEngine(root=document){
  const RX_BTN = /\[\[btn:(?<act>[a-z0-9_-]+)(?:\|(?<label>[^\]]+))?\]\]/gi;
  root.querySelectorAll('p,li,blockquote,td,th,h1,h2,h3,h4,h5,h6,div').forEach(el=>{
    const html = el.innerHTML;
    if(!html || html.indexOf('[[btn:')===-1) return;
    el.innerHTML = html.replace(RX_BTN, (m)=>{
      const g = m.match(/\[\[btn:([a-z0-9_-]+)(?:\|([^\]]+))?\]\]/i);
      const act=(g&&g[1])||'act', label=(g&&g[2])||act;
      return `<button class="md-btn" data-btn="${act}">${label}</button>`;
    });
  });
}

/* ===== CALLOUT ENGINE ===== */
function CalloutEngine(root=document){
  const RX_LINE = /^::(info|warn|pulse|loop)\s+(.*)$/i;
  const blocks = $$('p,div,li,blockquote,pre', root);
  for(const el of blocks){
    const txt = (el.textContent||'').trim();
    const m = txt.match(RX_LINE);
    if(!m) continue;
    const type = m[1].toLowerCase();
    const rest = txt.replace(RX_LINE, '$2');
    const box = document.createElement('div');
    box.className = `callout ${type}`;
    const copy = document.createElement('span'); copy.className='copy-hint'; copy.textContent='Copiar';
    box.append(copy, document.createTextNode(rest));
    el.replaceWith(box);
  }
}

/* ===== INLINE HEAVY ===== */
function inlineEnhanceHTML(html){
  if(!html) return html;
  let out = html;
  out = out.replace(/\[\[([^[\]]+)\]\]/g, (_,x)=>`<span class="chip-btn" data-chip="${x}">${x}</span>`);
  out = out.replace(/(^|[^!])\[([^[\]]+)\](\([^)]*\))?/g, (m,prefix,label,maybeLink)=>{
    if(maybeLink && /^\(/.test(maybeLink)) return m;
    return `${prefix}<span class="chip" data-chip="${label}">${label}</span>`;
  });
  out = out.replace(/(^|[\s>])([A-Za-zÀ-ÿ0-9_]+):(?=\s|$)/g, '$1<strong>$2:</strong>');
  out = out.replace(/`([^`]+)`/g,'<code class="code-inline">$1</code>');
  out = out.replace(/\$([^$\n]+)\$/g,'<span class="math">$1</span>');
  return out;
}
function InlineEngine(root=document){
  $$('p,li,blockquote,td,th,h1,h2,h3,h4,h5,h6', root).forEach(el=>{
    if(el.closest('pre,code,.no-inline')) return;
    if(el.dataset.inlineDone==='1') return;
    el.innerHTML = inlineEnhanceHTML(el.innerHTML);
    el.dataset.inlineDone='1';
  });
}

/* ===== IA BRIDGE (re-uses global RenderBus) ===== */
ensureBus().on('btn', async ({id,ctx})=>{
  try{
    const SK = localStorage.getItem('SK_INFODOSE');
    if(!SK){ safeToast('Cole sua SK em Configurações.'); return; }
    const map = { gerar:'complete', loop:'continue', tts:'speak' };
    const mode = map[id] || 'complete';
    const payload = { mode, section: ctx?.section||'root', text: ctx?.text||'' };
    const r = await fetch('https://api.seu-backend.ai/route', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+SK},
      body: JSON.stringify(payload)
    });
    const j = await r.json().catch(()=>({output:'Erro'}));
    const out = document.createElement('div'); out.className='callout info';
    out.textContent = j.output || 'ok';
    (document.activeElement?.closest('.callout, section, article, .sec')||document.body).appendChild(out);
  }catch(err){ console.warn('IA Bridge error', err); }
});

/* ===== Click bind (global delegation) ===== */
document.addEventListener('click', e=>{
  const b=e.target.closest('.md-btn'); if(!b) return;
  const id=b.dataset.btn;
  const ctx={section:b.closest('section,article,.sec,div')?.id||null,text:String(getSelection()||'')};
  ensureBus().emit('btn',{id,ctx});
}, true);

/* ===== CSS Skin (auto-inject once) ===== */
(function injectCSS(){
  if(document.getElementById('map_rgx_v2_css')) return;
  const s=document.createElement('style'); s.id='map_rgx_v2_css';
  s.textContent=`
.md-btn{border:1px solid rgba(255,255,255,.18);
  background:linear-gradient(42deg,#0c1422,#0f1a2a);
  border-radius:10px;padding:8px 12px;color:var(--ink,#e8ecf6);
  cursor:pointer;transition:.25s;user-select:none}
.md-btn:hover{background:linear-gradient(42deg,#00ff99,#00ccff);color:#000}
.callout{padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:8px 0;background:rgba(10,14,24,.6)}
.callout.info{border-color:#8ff5cf}
.callout.warn{border-color:#ffcf66}
.callout.pulse{border-color:#00ff99;box-shadow:0 0 0 2px rgba(0,255,153,.08) inset}
.callout.loop{border-color:#a6b1ff}
.chip,.chip-btn{display:inline-grid;place-items:center;padding:.25rem .6rem;border-radius:999px;
  background:linear-gradient(42deg,#00ff99,#00ccff);color:#000;font-weight:700;margin:.1rem .2rem;
  box-shadow:0 2px 10px rgba(0,0,0,.35);cursor:pointer;user-select:none}
`; document.head.appendChild(s);
})();

log('module loaded ✓');
