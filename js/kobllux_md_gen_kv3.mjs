
// === GLITCH MODE (ASCII/Mojibake): decode uploaded bytes as windows-1252, no toggle ===
function __decodeBytes1252(ab){
  try{
    return new TextDecoder('windows-1252', {fatal:false}).decode(new Uint8Array(ab));
  }catch(e){
    try{ return new TextDecoder('utf-8').decode(new Uint8Array(ab)); }catch(_){ return ''; }
  }
}

function __tryFindTextarea(){
  return document.querySelector('#srcText, #src, textarea[name="src"], textarea');
}

/** Upload → textarea (staging), ALWAYS using windows-1252 glitch decode */
export function installUploadStagingGlitch(opts={}){
  const o = Object.assign({inputSelector:'input[type="file"], #upload, #fileUpload, .upload-input'}, opts||{});
  const inputs = Array.from(document.querySelectorAll(o.inputSelector));
  const ta = __tryFindTextarea();
  if(!inputs.length || !ta) return;
  inputs.forEach(inp=>{
    if(inp.dataset.mdgenGlitch==='1') return;
    inp.dataset.mdgenGlitch='1';
    inp.addEventListener('change', (ev)=>{
      const f = ev.target.files && ev.target.files[0];
      if(!f) return;
      const reader = new FileReader();
      reader.readAsArrayBuffer(f); // raw bytes
      reader.onload = ()=>{
        const text = __decodeBytes1252(reader.result);
        ta.value = text;
        ta.focus();
        // small select to show effect
        ta.setSelectionRange(0, Math.min(text.length, 2000));
        (window.toast||console.log)('Upload carregado no input (GLITCH 1252 staging).');
      };
    }, false);
  });
}


/* ============================================================
   KOBLLUX — MD Smart Generator (ARN) · v1.0
   Converte texto bruto → Markdown no padrão Infodose/KOBLLUX:
   - Callouts (::info, ::warn, ::aside, ?, :)
   - Tabelas pipe → "lista-tabela" (linhas de dados com "- ")
   - Blocos interativos [[btn:...]]
   - Chips/ARN via [Termo] (o MAP_RGX v3 converte)
   - Código: converte ''' → ```; detecta funções “entre aspas”
   ============================================================ */
export function generateSmartMD(input, opts={}){
  const o = Object.assign({
    title: 'Documento Convertido',
    addHeaderButtons: true,
    addMeta: true
  }, opts||{});

  // --- Normalização ---
  let txt = String(input||'')
    .replace(/\r\n?/g, '\n')
    .replace(/[“”]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/'''/g, '```'); // cercas alternativas

  // --- Headings ausentes? Garante um título no topo ---
  if(!/^#\s/m.test(txt)){
    txt = `# ${o.title}\n\n` + txt;
  }

  // --- Heurística de callouts inteligentes ---
  const lines = txt.split('\n');
  const OUT = [];
  let i = 0;

  function push(s){ OUT.push(s); }

  const KEY_WARN  = /\b(atenç(ã|a)o|cuidado|risco|quebra|bug|perigo)\b/i;
  const KEY_INFO  = /\b(nota|observa(ç|c)[aã]o|info|dica|lembrete)\b/i;
  const KEY_ASIDE = /\b(contexto|bastidor|extra|observa(ç|c)[aã]o lateral)\b/i;
  const KEY_OK    = /\b(sucesso|ok|pronto|feito)\b/i;
  const KEY_Q     = /\?\s*$/;

  while(i < lines.length){
    let line = lines[i];

    // Code fence: copia como está até fechar
    if(/^\s*```/.test(line)){
      push(line); i++;
      while(i < lines.length && !/^\s*```/.test(lines[i])){
        push(lines[i]); i++;
      }
      if(i < lines.length) push(lines[i++]);
      continue;
    }

    // Função "entre aspas" em linha única vira bloco de código
    const mFnQuoted = line.match(/^\s*["“”](.+function\s+[a-zA-Z_$][\w$]*\s*\([^)]*\)\s*\{.*\})["“”]\s*$/);
    if(mFnQuoted){
      push('```js');
      push(mFnQuoted[1]);
      push('```');
      i++; continue;
    }

    // Callout automático por palavra-chave
    const plain = line.trim();
    if(plain){
      if(KEY_WARN.test(plain)){ push(`::warn ${plain}`); i++; continue; }
      if(KEY_ASIDE.test(plain)){ push(`::aside ${plain}`); i++; continue; }
      if(KEY_INFO.test(plain)){ push(`::info ${plain}`); i++; continue; }
      if(KEY_OK.test(plain)){  push(`: ${plain}`); i++; continue; }
      if(KEY_Q.test(plain)){   push(`? ${plain}`); i++; continue; }
    }

    push(line);
    i++;
  }

  let md = OUT.join('\n');


  // --- Normaliza callouts em bloco: "::warn" na linha + texto nas próximas linhas → "::warn <texto>"
  md = md.replace(/(^|\n)::(info|warn|aside|pulse|loop)\s*\n+([^:\n>][^\n]+(?:\n(?!::(info|warn|aside|pulse|loop)\b)[^\n]+)*)/gi,
                  (m, pre, kind, body)=>{
                    const oneline = body.replace(/\s*\n\s*/g, ' ').trim();
                    return `${pre}::${kind} ${oneline}`;
                  });

  // --- Conversão de tabelas: header+sep normais; linhas com prefixo "- " e (opcional) chave em parênteses ---
  md = md.replace(
    /(^|\n)\|([^\n]+)\|\n\|([ :\-|]+)\|\n((?:\|[^\n]+\|\n?)+)/g,
    (m, pre, headerRow, sepRow, bodyRows) => {
      const headers = headerRow.split('|').map(s=>s.trim());
      // Detecta coluna-chave: "(key)" ou "[key]" ou "*" no header, ou nomes "chave" / "key"
      let keyIdx = -1;
      for (let i=0;i<headers.length;i++){
        const h = headers[i];
        if (/\(key\)|\[key\]|\*$/i.test(h) || /\b(chave|key)\b/i.test(h)){
          keyIdx = i; headers[i] = h.replace(/\s*(\(key\)|\[key\]|\*)\s*$/i,''); break;
        }
      }
      const body = bodyRows
        .trim()
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean)
        .map(r => {
          const cells = r.replace(/^\|/,'').replace(/\|$/,'').split('|').map(s=>s.trim());
          if(keyIdx >= 0 && keyIdx < cells.length){
            // envolve a célula-chave em parênteses (se já não tiver)
            const c = cells[keyIdx];
            cells[keyIdx] = /^\(.*\)$/.test(c) ? c : `(${c})`;
          }
          return '- | ' + cells.join(' | ') + ' |';
        })
        .join('\n');
      return `${pre}|${headers.join(' | ')}|\n|${sepRow}|\n${body}\n`;
    }
  );
  // --- Tabelas pipe → lista‑tabela (linhas de dados com "- ") ---
  md = md.replace(
    /(^|\n)\|([^\n]+)\|\n\|([ :\-|]+)\|\n((?:\|[^\n]+\|\n?)+)/g,
    (m, pre, headerRow, sepRow, bodyRows) => {
      const body = bodyRows
        .trim()
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean)
        .map(r => r.replace(/^\|/, '- |').replace(/\|$/, ' |'))
        .join('\n');
      return `${pre}|${headerRow}|\n|${sepRow}|\n${body}\n`;
    }
  );

  // --- Header com botões interativos ---
  if(o.addHeaderButtons){
    md = md.replace(/^#\s+.+$/m, (h1)=>{
      const btns = [
        '[[btn:gerar|Gerar]]',
        '[[btn:nested|Gerar (aninhado)]]',
        '[[btn:md|Salvar .md]]',
        '[[btn:pdf|Imprimir PDF]]'
      ].join(' ');
      return `${h1}\n\n${btns}\n`;
    });
  }

  // --- Metadados opcionais ---
  if(o.addMeta){
    md += `\n\n::aside Documento gerado por MD Smart Generator (ARN) v1.0`;
  }

  return md;
}


/* ============== UI helper: adiciona botão "Gerar (inteligente)" no painel existente ============== */
export function mountMDGeneratorButton(){
  // Tenta achar o painel de texto padrão do index.html atual
  const tab = document.querySelector('#tab-text');
  if(!tab) return;

  // evita duplicar
  if(tab.querySelector('.btn-gen-inteligente')) return;

  const ta = tab.querySelector('#srcText');
  const bar = document.createElement('div');
  bar.style.display = 'flex';
  bar.style.gap = '8px';
  bar.style.marginTop = '8px';

  
  const bConv = document.createElement('button');
  bConv.className = 'btn btn-converter';
  bConv.textContent = 'Converter → MD';
  bConv.onclick = ()=>{
    const raw = (ta && ta.value) ? ta.value : '';
    const md = generateSmartMD(raw || '# Documento\n\nTexto aqui...');
    if(ta){ ta.value = md; ta.focus(); ta.setSelectionRange(0, md.length); }
    if(window.toast) toast('Texto convertido para MD (sem render)');
  };

  const bGen = document.createElement('button');
  bGen.className = 'btn btn-gen-inteligente';
  bGen.textContent = 'Converter+Gerar';
  bGen.onclick = ()=>{
    const raw = (ta && ta.value) ? ta.value : '';
    const md = generateSmartMD(raw || '# Documento\n\nTexto aqui...');
    if(typeof window.autoBuild === 'function'){
      window.autoBuild(md);
      if(window.toast) toast('Convertido e renderizado (ARN)');
    }else{
      alert(md);
    }
  };

  bar.appendChild(bConv);
  bar.appendChild(bGen);
  tab.appendChild(bar);

}


/* ============== Patch opcional: exportador .md "lista‑tabela" ============== */
export function installExportMD_ListTable(){
  if(window.exportMD) return; // não sobrescreve se já existir
  window.exportMD = function(){
    const root = document.getElementById('root');
    if(!root){ alert('Sem root'); return; }
    const parts = [];

    // captura headings
    root.querySelectorAll('details.acc').forEach((d,secIdx)=>{
      const h = d.querySelector('summary h2');
      if(h){
        const mark = '#'.repeat( Math.max(1, Math.min(6, (secIdx===0?1:2))) );
        parts.push(`${mark} ${h.textContent.trim()}`);
      }
      d.querySelectorAll('.sec > *').forEach(el=>{
        if(el.matches('p')){
          parts.push(el.innerText.replace('Copiar','').trim());
        }else if(el.matches('blockquote')){
          parts.push('> ' + el.innerText.replace('Copiar','').trim());
        }else if(el.matches('.callout')){
          const t = el.className.match(/\b(info|warn|tip|note|success|danger|aside|question)\b/);
          const kind = t ? (t[1]==='note'?':': t[1]==='question'?'?': t[1]==='aside'?'::.': '::'+t[1]) : ': ';
          parts.push(`${kind} ` + el.innerText.replace('Copiar','').trim());
        }else if(el.matches('pre.md-code')){
          const code = el.querySelector('code')?.textContent||'';
          parts.push('```\n'+code+'\n```');
        }else if(el.matches('.equation') && !/function/.test(el.innerText)){
          parts.push('$$\n'+el.innerText.replace('Copiar','').trim()+'\n$$');
        }else if(el.matches('table.md-table')){
          // volta para lista‑tabela (linha de cabeçalho e separador sem "- ")
          const rows = Array.from(el.querySelectorAll('tr')).map(tr=>Array.from(tr.children).map(td=>td.innerText.trim()));
          if(rows.length){
            parts.push('| '+rows[0].join(' | ')+' |');
            parts.push('| '+rows[0].map(()=> '---').join(' | ')+' |');
            rows.slice(1).forEach(r=> parts.push('- | '+r.join(' | ')+' |') );
          }
        }else if(el.matches('ul,ol')){
          el.querySelectorAll('li').forEach(li=>{
            parts.push('- '+li.innerText.trim());
          });
        }
      });
    });

    const blob = new Blob([parts.join('\n\n')], {type:'text/markdown'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'export_listTable.md';
    a.click();
    URL.revokeObjectURL(a.href);
    if(window.toast) toast('.md exportado (lista‑tabela)');
  };
}


/* ============== Auto‑mount opcional ============== */

/* ============== Upload → Textarea (staging antes de render) ============== */
function tryFindTextarea(){
  return document.querySelector('#srcText, #src, textarea[name="src"], textarea');
}

export function installUploadStaging(opts={}){
  const o = Object.assign({
    inputSelector: 'input[type="file"], #upload, #fileUpload, .upload-input',
    stageOnly: true, // true = não renderiza automaticamente
    encoding: 'utf-8'
  }, opts||{});

  const ta = tryFindTextarea();
  const inputs = Array.from(document.querySelectorAll(o.inputSelector));
  if(!inputs.length) return;

  inputs.forEach(inp=>{
    // Evita duplicar listener
    if(inp.dataset.mdgenUpload==='1') return;
    inp.dataset.mdgenUpload='1';
    inp.addEventListener('change', (ev)=>{
      const f = ev.target.files && ev.target.files[0];
      if(!f) return;
      const reader = new FileReader();
      try{
        reader.readAsText(f, o.encoding);
      }catch(e){
        // Fallback: sem hint de encoding
        reader.readAsText(f);
      }
      reader.onload = ()=>{
        const text = String(reader.result||'');
        if(ta){
          ta.value = text;
          ta.focus();
          ta.setSelectionRange(0, Math.min(text.length, 2000));
        }
        if(!o.stageOnly && typeof window.autoBuild==='function'){
          window.autoBuild(text);
        }else{
          (window.toast||console.log)('Upload carregado no input (staging).');
        }
      };
      reader.onerror = ()=>{
        console.warn('Falha ao ler arquivo (upload staging).');
      };
    }, false);
  });
}
export function autoMountMDGen(){
  try{
    mountMDGeneratorButton();
    installUploadStagingGlitch();
    installExportMD_ListTable();
    // Sinaliza no console
    console.info('[MD Smart Generator] pronto.');
  }catch(e){
    console.warn('MDGen mount fail', e);
  }
}
