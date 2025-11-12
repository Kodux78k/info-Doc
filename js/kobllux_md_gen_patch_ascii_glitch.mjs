/* KOBLLUX PATCH — ASCII GLITCH MODE v1
 * -------------------------------------
 * transforma caracteres fora da faixa ASCII em arte bugada
 * sem quebrar o encoding UTF-8 real (visual apenas)
 */

export function installAsciiGlitchMode({ selector = 'textarea, pre, code', intensity = 0.6 } = {}) {
  const els = document.querySelectorAll(selector);
  els.forEach(el => {
    const original = el.textContent;
    el.dataset.originalText = original;

    el.addEventListener('mouseenter', () => {
      if (!el.classList.contains('glitched')) return;
      el.textContent = glitchify(original, intensity);
    });
    el.addEventListener('mouseleave', () => {
      if (!el.classList.contains('glitched')) return;
      el.textContent = original;
    });
  });

  // botão global para alternar
  if (!document.querySelector('#glitchToggle')) {
    const btn = document.createElement('button');
    btn.id = 'glitchToggle';
    btn.textContent = 'GL!TCH';
    Object.assign(btn.style, {
      position: 'fixed', top: '12px', left: '12px',
      background: '#000', color: '#0f0',
      border: '1px solid #0f0', borderRadius: '6px',
      padding: '6px 10px', fontFamily: 'monospace', zIndex: 9999
    });
    btn.onclick = () => {
      const active = document.body.classList.toggle('ascii-glitch');
      document.querySelectorAll(selector).forEach(el => {
        el.classList.toggle('glitched', active);
      });
      btn.style.color = active ? '#f0f' : '#0f0';
    };
    document.body.appendChild(btn);
  }
}

function glitchify(text, intensity) {
  return text.split('').map(ch => {
    if (ch.charCodeAt(0) > 127 && Math.random() < intensity) {
      const r = Math.random();
      return r > 0.8 ? '?' : r > 0.6 ? '▒' : r > 0.3 ? '░' : '█';
    }
    return ch;
  }).join('');
}
