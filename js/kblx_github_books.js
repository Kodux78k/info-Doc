/* MOBILE-FIRST VERTICAL HARD-LOCK */
/* KBLX_GithubBooks v1 — Loader de Markdown remoto (GitHub) em Base Madeira */

(function (global) {
  'use strict';

  // Namespace global
  const KBLX_GithubBooks = {
    registry: [],
    mounted: false,
    mountSelector: '#kblx-gh-books',
    previewSelector: '#preview', // fallback se não tiver RenderBus
    theme: {
      bg: '#05070c',
      panel: '#0c111d',
      border: 'rgba(255,255,255,0.08)',
      accent: '#44e08a',    // Base Madeira (verde)
      accentSoft: 'rgba(68,224,138,0.08)',
      text: '#e8ecf6',
      muted: '#9aa3bc'
    }
  };

  // ========= REGISTRY DEFAULT (pode editar/adicionar) =========
  KBLX_GithubBooks.registry = [
    {
      id: 'codex-azure-readme',
      label: 'CÓDICE AZURE — README (livro-portal)',
      description: 'Manifesto principal, linha temporal e síntese.',
      rawUrl: 'https://raw.githubusercontent.com/truetruextrue/codex-azure/main/README.md'
    },
    {
      id: 'codex-azure-tabelas',
      label: 'CÓDICE AZURE — Tabelas',
      description: 'Camadas, eras, verbos e estrutura em Markdown.',
      rawUrl: 'https://raw.githubusercontent.com/truetruextrue/codex-azure/main/docs/codex_tables.md'
    }
    // Adicione outros repositórios/livros aqui
    // { id:'...', label:'...', description:'...', rawUrl:'https://raw.githubusercontent.com/.../README.md' }
  ];

  // ========= STYLE INJECTOR =========
  function injectStyles() {
    if (document.getElementById('kblx-github-books-style')) return;

    const css = `
    /* KBLX_GithubBooks — mobile first, vertical hard-lock */
    ${KBLX_GithubBooks.mountSelector} {
      box-sizing:border-box;
      width:100%;
      max-width:600px;
      margin:16px auto;
      padding:12px 12px 16px;
      border-radius:16px;
      background:${KBLX_GithubBooks.theme.panel};
      border:1px solid ${KBLX_GithubBooks.theme.border};
      color:${KBLX_GithubBooks.theme.text};
      font-family:system-ui,-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;
    }
    ${KBLX_GithubBooks.mountSelector} * {
      box-sizing:border-box;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-header {
      display:block;
      margin-bottom:8px;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-title {
      font-size:16px;
      font-weight:600;
      letter-spacing:0.03em;
      text-transform:uppercase;
      color:${KBLX_GithubBooks.theme.accent};
      margin-bottom:4px;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-sub {
      font-size:12px;
      color:${KBLX_GithubBooks.theme.muted};
      line-height:1.4;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-list {
      margin-top:10px;
      display:block;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-item {
      width:100%;
      margin-bottom:8px;
      padding:10px 10px 10px;
      border-radius:12px;
      border:1px solid ${KBLX_GithubBooks.theme.border};
      background:rgba(0,0,0,0.28);
      display:block;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-item-head {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-item-title {
      font-size:14px;
      font-weight:500;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-item-status {
      font-size:11px;
      padding:2px 8px;
      border-radius:999px;
      border:1px solid ${KBLX_GithubBooks.theme.border};
      color:${KBLX_GithubBooks.theme.muted};
      white-space:nowrap;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-item-desc {
      margin-top:4px;
      font-size:12px;
      color:${KBLX_GithubBooks.theme.muted};
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-actions {
      margin-top:8px;
      display:flex;
      flex-direction:column;
      gap:6px;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-btn {
      width:100%;
      border-radius:999px;
      border:none;
      padding:10px 12px;
      font-size:14px;
      font-weight:500;
      background:linear-gradient(42deg, ${KBLX_GithubBooks.theme.accentSoft}, rgba(0,0,0,0.5));
      color:${KBLX_GithubBooks.theme.text};
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:6px;
      touch-action:manipulation;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-btn-secondary {
      background:rgba(0,0,0,0.5);
      border:1px solid ${KBLX_GithubBooks.theme.border};
      font-size:12px;
      font-weight:400;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-btn:active {
      transform:translateY(1px);
      opacity:0.9;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-meta {
      margin-top:10px;
      font-size:11px;
      color:${KBLX_GithubBooks.theme.muted};
      line-height:1.4;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-meta span {
      display:block;
    }
    ${KBLX_GithubBooks.mountSelector} .kblx-gh-item-opened {
      border-color:${KBLX_GithubBooks.theme.accent};
      box-shadow:0 0 0 1px rgba(68,224,138,0.15);
      background:${KBLX_GithubBooks.theme.accentSoft};
    }
    @media (max-width:480px) {
      ${KBLX_GithubBooks.mountSelector} {
        border-radius:0;
        border-left:none;
        border-right:none;
      }
    }`;

    const el = document.createElement('style');
    el.id = 'kblx-github-books-style';
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ========= STORAGE HELPERS =========
  function getHistory() {
    try {
      const raw = localStorage.getItem('kblx_gh_books_history');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function setHistory(history) {
    try {
      localStorage.setItem('kblx_gh_books_history', JSON.stringify(history));
    } catch (e) {
      // ignore
    }
  }

  function markOpened(id) {
    const history = getHistory();
    history[id] = {
      lastOpened: new Date().toISOString()
    };
    setHistory(history);
  }

  function getStatus(id) {
    const history = getHistory();
    if (!history[id]) return null;
    return history[id];
  }

  // ========= RENDER UI =========
  function renderUI() {
    const mount = document.querySelector(KBLX_GithubBooks.mountSelector);
    if (!mount) return;
    mount.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'kblx-gh-header';
    header.innerHTML = `
      <div class="kblx-gh-title">Livros-Portal (GitHub)</div>
      <div class="kblx-gh-sub">
        README e .md públicos transformados em livro para o teu Templo — Base Madeira, versão KOBLLUX.
      </div>
    `;
    mount.appendChild(header);

    const list = document.createElement('div');
    list.className = 'kblx-gh-list';

    const history = getHistory();

    KBLX_GithubBooks.registry.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'kblx-gh-item';
      if (history[entry.id]) {
        item.classList.add('kblx-gh-item-opened');
      }

      const lastOpenedText = history[entry.id]
        ? new Date(history[entry.id].lastOpened).toLocaleString()
        : 'Ainda não aberto';

      item.innerHTML = `
        <div class="kblx-gh-item-head">
          <div class="kblx-gh-item-title">${entry.label}</div>
          <div class="kblx-gh-item-status">
            ${history[entry.id] ? 'Aberto' : 'Novo'}
          </div>
        </div>
        <div class="kblx-gh-item-desc">${entry.description || ''}</div>
        <div class="kblx-gh-actions">
          <button class="kblx-gh-btn" data-kblx-open="${entry.id}">
            <span>📖 Abrir livro</span>
          </button>
          <button class="kblx-gh-btn kblx-gh-btn-secondary" data-kblx-open-raw="${entry.id}">
            Ver fonte bruta (.md)
          </button>
        </div>
        <div class="kblx-gh-meta">
          <span>ID: ${entry.id}</span>
          <span>Última leitura: ${lastOpenedText}</span>
        </div>
      `;
      list.appendChild(item);
    });

    mount.appendChild(list);

    mount.addEventListener('click', function (ev) {
      const openBtn = ev.target.closest('[data-kblx-open]');
      const rawBtn = ev.target.closest('[data-kblx-open-raw]');

      if (openBtn) {
        const id = openBtn.getAttribute('data-kblx-open');
        openBook(id, { mode: 'render' });
      } else if (rawBtn) {
        const id = rawBtn.getAttribute('data-kblx-open-raw');
        openBook(id, { mode: 'raw' });
      }
    });
  }

  // ========= FETCH & RENDER =========
  async function fetchMarkdown(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('HTTP ' + res.status + ' ao buscar ' + url);
    }
    return await res.text();
  }

  function pipeToRenderer(md, meta) {
    // 1) RenderBus (preferencial)
    if (global.RenderBus && typeof global.RenderBus.fromMarkdown === 'function') {
      return global.RenderBus.fromMarkdown(md, meta || {});
    }

    // 2) KBLX.renderMarkdown, se existir
    if (global.KBLX && typeof global.KBLX.renderMarkdown === 'function') {
      return global.KBLX.renderMarkdown(md, meta || {});
    }

    // 3) Função global genérica
    if (typeof global.renderMarkdown === 'function') {
      return global.renderMarkdown(md, meta || {});
    }

    // 4) Fallback bruto: joga texto no #preview ou body
    const out = document.querySelector(KBLX_GithubBooks.previewSelector) || document.body;
    const pre = document.createElement('pre');
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.fontSize = '12px';
    pre.textContent = md;
    out.innerHTML = '';
    out.appendChild(pre);
  }

  async function openBook(id, opts) {
    opts = opts || {};
    const entry = KBLX_GithubBooks.registry.find(b => b.id === id);
    if (!entry) {
      alert('Livro-portal não encontrado: ' + id);
      return;
    }

    const mode = opts.mode || 'render';

    try {
      // Indicador básico (sem loader fixo pra não quebrar teu layout)
      console.log('[KBLX_GithubBooks] Abrindo', id, 'modo=', mode);
      const md = await fetchMarkdown(entry.rawUrl);

      // Log/meta global
      const meta = {
        source: 'github',
        id: entry.id,
        label: entry.label,
        rawUrl: entry.rawUrl,
        openedAt: Date.now()
      };

      if (mode === 'raw') {
        // Fallback: abrir em nova aba o raw, sem mexer no app
        window.open(entry.rawUrl, '_blank', 'noopener');
      } else {
        pipeToRenderer(md, meta);
      }

      markOpened(id);

      // disparar evento global p/ TTS, logs, etc
      try {
        const evt = new CustomEvent('kblx:book-opened', { detail: meta });
        global.dispatchEvent(evt);
      } catch (e) {
        // ignore older browsers
      }

      // re-render UI para atualizar status "Aberto"
      renderUI();
    } catch (err) {
      console.error('[KBLX_GithubBooks] Erro ao abrir livro', id, err);
      alert('Erro ao abrir livro-portal: ' + err.message);
    }
  }

  // ========= INIT =========
  KBLX_GithubBooks.init = function (options) {
    if (KBLX_GithubBooks.mounted) return;
    options = options || {};

    if (options.mountSelector) {
      KBLX_GithubBooks.mountSelector = options.mountSelector;
    }
    if (options.previewSelector) {
      KBLX_GithubBooks.previewSelector = options.previewSelector;
    }
    if (Array.isArray(options.registry) && options.registry.length) {
      KBLX_GithubBooks.registry = options.registry;
    }

    injectStyles();
    renderUI();
    KBLX_GithubBooks.mounted = true;

    console.log('[KBLX_GithubBooks] Init completo — livros-portais prontos.');
  };

  // ========= EXPORT =========
  global.KBLX_GithubBooks = KBLX_GithubBooks;

})(window);
