// kobllux_archetypes_v1.mjs
// Painel Arquetípico — registry + ações + renderer + CSS + sinais
'use strict';

/* ---------- REGISTRY ---------- */
export const ALL = {
  Atlas:   { label:'Atlas',   color:'#0B4F9C', tone:'ORACULO',  freq:261 }, // C4
  Nova:    { label:'Nova',    color:'#FF6EC7', tone:'NARRADOR', freq:329 }, // E4
  Vitalis: { label:'Vitalis', color:'#FF4D00', tone:'COACH',    freq:392 }, // G4
  Pulse:   { label:'Pulse',   color:'#7A2CF3', tone:'CALMO',    freq:523 }, // C5
  Artemis: { label:'Artemis', color:'#10B6FF', tone:'SCOUT',    freq:587 }, // D5
  Kaos:    { label:'Kaos',    color:'#FF1A1A', tone:'FIRE',     freq:440 }, // A4
  Genus:   { label:'Genus',   color:'#FFD400', tone:'MAKER',    freq:493 }, // B4
  Serena:  { label:'Serena',  color:'#FFC6D0', tone:'CARE',     freq:698 }, // F5
  Lumine:  { label:'Lumine',  color:'#FFF36E', tone:'LIGHT',    freq:784 }, // G5
  Rhea:    { label:'Rhea',    color:'#8E44FF', tone:'HEAL',     freq:349 }, // F4
  Solus:   { label:'Solus',   color:'#6A737B', tone:'MONK',     freq:311 }, // Eb4
  Aion:    { label:'Aion',    color:'#20F2B3', tone:'TIME',     freq:659 }, // E5
};
const ORDER = Object.keys(ALL);

/* ---------- UTILS ---------- */
const toast = (m)=>{ try{ window.toast(m); }catch{ console.log('[KOBLLUX]', m); } };

function beep(freq=440, ms=120){
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ac = new Ctx();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type='sine'; o.frequency.value=freq; g.gain.value=.06;
    o.connect(g).connect(ac.destination); o.start();
    setTimeout(()=>{ o.stop(); ac.close(); }, ms);
  }catch{}
}

function setAccent(color){
  document.documentElement.style.setProperty('--accent', color);
}
function dispatchChange(id){
  document.dispatchEvent(new CustomEvent('archetypechange',{detail:{id}}));
}

/* ---------- CORE API ---------- */
export function getActive(){
  return localStorage.getItem('ARCHETYPE_ACTIVE') || 'KOBLLUX';
}

export function applyArchetype(id, opts={}){
  const a = ALL[id]; if(!a) return false;
  localStorage.setItem('ARCHETYPE_ACTIVE', id);
  localStorage.setItem('VOICE_TONE', a.tone);
  setAccent(a.color);
  document.body.setAttribute('data-archetype', id);
  if(opts.beep!==false) beep(a.freq);
  if(opts.toast!==false) toast(`ARCHETYPE_ACTIVE = ${id}`);
  dispatchChange(id);
  return true;
}

/* ---------- ACTIONS HUB ---------- */
function ensureActions(){
  window.ACTIONS = window.ACTIONS || {};
  window.registerKoblluxAction = window.registerKoblluxAction || function(name, fn){
    window.ACTIONS[name] = fn;
  };
}
export function registerActions(){
  ensureActions();
  // ações diretas: arch.Atlas etc
  ORDER.forEach(id=>{
    window.registerKoblluxAction(`arch.${id}`, ()=>applyArchetype(id));
  });
  // ações utilitárias
  window.registerKoblluxAction('arch.random', ()=>{
    const id = ORDER[Math.floor(Math.random()*ORDER.length)];
    applyArchetype(id);
  });
  window.registerKoblluxAction('arch.next', ()=>{
    const cur = getActive();
    const idx = Math.max(0, ORDER.indexOf(cur));
    applyArchetype( ORDER[(idx+1)%ORDER.length] );
  });
  window.registerKoblluxAction('arch.prev', ()=>{
    const cur = getActive();
    const idx = Math.max(0, ORDER.indexOf(cur));
    applyArchetype( ORDER[(idx-1+ORDER.length)%ORDER.length] );
  });
  // render rápido do painel
  window.registerKoblluxAction('arch.panel', ()=>{
    const host = document.getElementById('arch-panel');
    if(host) renderPanel({container:host});
  });
}

/* ---------- RENDERER ---------- */
export function renderPanel({container='#arch-panel', layout='grid'} = {}){
  const host = (typeof container==='string') ? document.querySelector(container) : container;
  if(!host) return;
  host.classList.add('kob-arch-panel', `layout-${layout}`);
  host.innerHTML = ORDER.map(id=>{
    const a = ALL[id];
    return `
    <button class="arch-btn" data-action="arch.${id}" style="--c:${a.color}">
      <span class="dot"></span>${a.label}
    </button>`;
  }).join('');
}

/* ---------- CSS ---------- */
export function injectCSS(){
  if(document.getElementById('kob-arch-css')) return;
  const s = document.createElement('style'); s.id='kob-arch-css';
  s.textContent = `
.kob-arch-panel{ display:flex; flex-wrap:wrap; gap:.5rem; align-items:center }
.kob-arch-panel.layout-grid{ gap:.6rem }
.kob-arch-panel .arch-btn{
  border:1px solid rgba(255,255,255,.18);
  background:linear-gradient(42deg,#0c1422,#0f1a2a);
  color:var(--ink,#e8ecf6);
  border-radius:999px; padding:.5rem .8rem; font-size:.85rem;
  cursor:pointer; transition:.25s;
}
.kob-arch-panel .arch-btn:hover{
  background:linear-gradient(42deg,var(--c),#00ccff);
  color:#000;
}
.kob-arch-panel .arch-btn .dot{
  display:inline-block; width:.8em; height:.8em; border-radius:50%;
  background:var(--c); margin-right:.5em; vertical-align:-.12em;
}
:root{ --accent:#00ffb3 }
`;
  document.head.appendChild(s);
}

/* ---------- BOOT (facilita uso) ---------- */
export function boot({container, layout}={}){
  injectCSS();
  registerActions();
  if(container) renderPanel({container, layout});
  // aplica cor do ativo se existir
  const cur = getActive();
  if(ALL[cur]) setAccent(ALL[cur].color);
}

export default { ALL, boot, injectCSS, renderPanel, registerActions, getActive, applyArchetype };
