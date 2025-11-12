/* ============================================================
   KOBLLUX — MAP_RGX_v3_KOBLLUX.mjs  (ESM / module)
   Markdown Action Protocol + AI + Voice + UI (sem mexer no BG global)
   ============================================================ */

const $$ = (q, r=document) => Array.from(r.querySelectorAll(q));
const log = (...a) => console.log('[MAP_RGX_v3_KOBLLUX]', ...a);
const safeToast = (m) => {
  try { if (window.toast) window.toast(m); else log(m); }
  catch { log(m); }
};

/* === EXPORT CORE === */
export function applyRGX(root=document){
  InlineEngine(root);
  ButtonEngine(root);
  CalloutEngine(root);
  injectCSS();
  log('applyRGX() executed · v3_KOBLLUX');
}
export default { applyRGX };

/* === RenderBus · soft attach === */
function ensureBus(){
  const bus = window.RenderBus || (window.RenderBus = {
    _:{},
    on(e,f){ (this._[e]=this._[e]||[]).push(f); },
    emit(e,p){ (this._[e]||[]).forEach(fn=>{ try{ fn(p);}catch(err){ console.warn('RenderBus error',err);} }); }
  });
  return bus;
}
ensureBus();

/* === BUTTON ENGINE === */
function ButtonEngine(root=document){
  const RX_BTN = /\[\[btn:(?<act>[a-z0-9_-]+)(?:\|(?<label>[^\]]+))?\]\]/gi;
  root.querySelectorAll('p,li,blockquote,td,th,h1,h2,h3,h4,h5,h6,div').forEach(el=>{
    const html = el.innerHTML;
    if(!html || html.indexOf('[[btn:')===-1) return;
    el.innerHTML = html.replace(RX_BTN, (m)=>{
      const g = m.match(/\[\[btn:([a-z0-9_-]+)(?:\|([^\]]+))?\]\]/i);
      const act = (g&&g[1])||'act';
      const label = (g&&g[2])||act;
      return `<button class="md-btn" data-btn="${act}">${label}</button>`;
    });
  });
}

/* === CALLOUT ENGINE === */
function CalloutEngine(root=document){
  const RX_LINE = /^::(info|warn|pulse|loop|aside)\s+(.*)$/i;
  const blocks = $$('p,div,li,blockquote,pre', root);
  for(const el of blocks){
    const txt = (el.textContent||'').trim();
    const m = txt.match(RX_LINE);
    if(!m) continue;
    const type = m[1].toLowerCase();
    const rest = txt.replace(RX_LINE, '$2');
    const box = document.createElement('div');
    box.className = `callout ${type}`;
    const copy = document.createElement('span');
    copy.className='copy-hint';
    copy.textContent='◎ Copiar';
    box.append(copy, document.createTextNode(' ' + rest));
    el.replaceWith(box);
  }
}

/* === INLINE HEAVY MARKDOWN BEAUTY === */
function inlineEnhanceHTML(html){
  if(!html) return html;
  let out = html;

  // [[algo]] -> chip-btn
  out = out.replace(/\[\[([^[\]]+)\]\]/g, (_,x)=>`<span class="chip-btn" data-chip="${x}">${x}</span>`);

  // [Termo] (sem link) -> chip
  out = out.replace(/(^|[^!])\[([^[\]]+)\](\([^)]*\))?/g, (m,prefix,label,maybeLink)=>{
    if(maybeLink && /^\(/.test(maybeLink)) return m; // é link normal, não mexe
    return `${prefix}<span class="chip" data-chip="${label}">${label}</span>`;
  });

  // Palavra: -> <strong>Palavra:</strong>
  out = out.replace(/(^|[\s>])([A-Za-zÀ-ÿ0-9_]+):(?=\s|$)/g, '$1<strong>$2:</strong>');

  // `code`
  out = out.replace(/`([^`]+)`/g,'<code class="code-inline">$1</code>');

  // $math$
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

/* === IA BRIDGE EXTENDED (gerar, loop, tts) === */
ensureBus().on('btn', async ({id,ctx})=>{
  try{
    const SK = localStorage.getItem('SK_INFODOSE');
    if(!SK){ safeToast('Cole sua SK_INFODOSE em Configurações.'); return; }

    const arche = localStorage.getItem('ARCHETYPE_ACTIVE') || 'KODUX';
    const tone  = localStorage.getItem('VOICE_TONE') || 'trinity';
    const mem   = localStorage.getItem('banco_kobllux') || '{}';

    const map = { gerar:'complete', loop:'continue', tts:'speak' };
    let mode  = map[id] || 'complete';

    if(id==='gerar' && ctx.text){
      const txt = ctx.text.toLowerCase();
      if(txt.includes('síntese')) mode='summary';
      else if(txt.includes('voz')) mode='speak';
      else if(txt.includes('código') || txt.includes('code')) mode='code';
    }

    const payload = {
      mode,
      section: ctx?.section||'root',
      text: ctx?.text||'',
      archetype: arche,
      tone,
      memory: mem
    };

    const r = await fetch('https://api.seu-backend.ai/route', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+SK
      },
      body: JSON.stringify(payload)
    });

    const j = await r.json().catch(()=>({output:'Erro na IA'}));

    const out = document.createElement('div');
    out.className = 'callout info';
    out.textContent = j.output || 'ok';
    (document.activeElement?.closest('.callout, section, article, .sec') || document.body)
      .appendChild(out);

    if(mode === 'speak' && j.output){
      speakText(j.output, ctx.rootEl || document.body);
    }

  }catch(err){
    console.warn('IA Bridge error', err);
  }
});

/* === TTS ENGINE (PT-BR) === */
function speakText(text, rootEl=document.body){
  if(!window.speechSynthesis){
    safeToast('TTS não suportado neste navegador.');
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = 'pt-BR';
  u.rate  = 1.05;
  u.pitch = 1.1;
  const voices = speechSynthesis.getVoices?.() || [];
  const v = voices.find(v=>v.name?.includes('Luciana') || v.lang === 'pt-BR');
  if(v) u.voice = v;

  const target = rootEl || document.body;
  u.onstart = ()=>{ target.classList.add('kobllux-speaking'); };
  u.onend   = ()=>{ target.classList.remove('kobllux-speaking'); };

  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

/* === CLICK DELEGATION (botões [[btn:...]]) === */
document.addEventListener('click', e=>{
  const b = e.target.closest('.md-btn');
  if(!b) return;
  const id = b.dataset.btn;
  const rootEl = b.closest('[data-kobllux-root]') || document.body;
  const ctx = {
    section: b.closest('section,article,.sec,div')?.id || null,
    text: String(getSelection()||''),
    rootEl
  };
  ensureBus().emit('btn',{id,ctx});
}, true);

/* === CSS SKIN (sem mexer no background global) === */
function injectCSS(){
  if(document.getElementById('map_rgx_v3_kobllux_css')) return;
  const s = document.createElement('style');
  s.id = 'map_rgx_v3_kobllux_css';
  s.textContent = `
/* Botão padrão MD */
.md-btn{
  border:1px solid rgba(255,255,255,.18);
  background:var(--kobllux-md-btn-bg, linear-gradient(42deg,#0c1422,#0f1a2a));
  border-radius:10px;
  padding:8px 12px;
  color:var(--kobllux-ink, #e8ecf6);
  cursor:pointer;
  transition:.25s;
  user-select:none;
  font-size:.85rem;
}
.md-btn:hover{
  background:var(--kobllux-md-btn-bg-hover, linear-gradient(42deg,#00ff99,#00ccff));
  color:#000;
  box-shadow:0 0 15px rgba(0,255,153,.35);
}

/* Callouts */
.callout{
  padding:10px 12px;
  border:1px solid rgba(255,255,255,.12);
  border-radius:12px;
  margin:8px 0;
  background:var(--kobllux-callout-bg, rgba(10,14,24,.75));
  backdrop-filter:blur(10px);
  position:relative;
  font-size:.85rem;
}
.callout.info{ border-color:#8ff5cf; }
.callout.warn{ border-color:#ffcf66; }
.callout.pulse{ border-color:#00ff99; box-shadow:0 0 0 2px rgba(0,255,153,.08) inset; }
.callout.loop{ border-color:#a6b1ff; }
.callout.aside{ border-color:#7ac8ff; opacity:.92; }

/* Hint copiar */
.copy-hint{
  position:absolute;
  top:5px;
  right:8px;
  font-size:.7em;
  opacity:.6;
  cursor:pointer;
}

/* Chips */
.chip,.chip-btn{
  display:inline-grid;
  place-items:center;
  padding:.25rem .6rem;
  border-radius:999px;
  background:var(--kobllux-chip-bg, linear-gradient(42deg,#00ff99,#00ccff));
  color:#000;
  font-weight:700;
  margin:.1rem .2rem;
  box-shadow:0 2px 10px rgba(0,0,0,.35);
  cursor:pointer;
  user-select:none;
  transition:.25s;
  font-size:.75rem;
}
.chip:hover,.chip-btn:hover{
  filter:brightness(1.08);
}
.chip-btn.active{
  box-shadow:0 0 0 2px rgba(0,255,153,.8);
  filter:brightness(1.15);
}

/* Highlight de FALA (apenas no root marcado) */
[data-kobllux-root].kobllux-speaking{
  box-shadow:0 0 30px 0 rgba(0,255,153,.45);
}

/* Inline code / math */
.code-inline{
  font-family:monospace;
  background:rgba(0,0,0,.35);
  padding:2px 4px;
  border-radius:4px;
}
.math{
  font-family:serif;
  font-style:italic;
}
`;
  document.head.appendChild(s);
}
