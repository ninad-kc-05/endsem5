(function () {
  'use strict';
  const P = window.Paper, s = window.SUBJECT_CONFIG;
  const modules = s.modules;
  const list = P.el('ul', { class: 'card-list se-module-list' });
  modules.forEach(m => list.append(P.card(m.id, m.name, P.route(s.id, m.id))));

  const style = document.createElement('style');
  style.textContent = `
    .se-search-wrap{margin:1.25rem 0 1.5rem;padding:1rem;border:1px solid var(--rule,#394253);border-radius:12px;background:var(--surface,var(--paper,#171d29))}
    .se-search-label{display:block;font-weight:700;margin-bottom:.55rem}
    .se-search-input{display:block;width:100%;min-width:0;box-sizing:border-box;padding:.85rem 1rem;border:1px solid var(--rule,#596579);border-radius:9px;background:var(--paper,#171d29);color:var(--ink,inherit);font:inherit}
    .se-search-meta{font-size:.9rem;color:var(--muted,#9aa5b5);margin:.55rem 0 0}
    .se-results{list-style:none;padding:0;margin:.8rem 0 0;display:grid;gap:.55rem}
    .se-result{min-width:0;border:1px solid var(--rule,#394253);border-radius:9px;padding:.75rem  .9rem}
    .se-result a{font-weight:700;text-decoration:none}
    .se-result p{margin:.35rem 0 0;overflow-wrap:anywhere}
    .se-result mark{background:#f3d77b;color:#171717;border-radius:2px}
    .se-no-results{padding:.8rem 0;color:var(--muted,#9aa5b5)}
    .se-module-list,.se-module-list *{min-width:0}
  `;
  document.head.append(style);

  const search = P.el('section', { class: 'se-search-wrap', 'aria-label': 'Search all Software Engineering modules' });
  const label = P.el('label', { class: 'se-search-label', for: 'se-global-search', text: 'Search across all SE modules' });
  const input = P.el('input', { id: 'se-global-search', class: 'se-search-input', type: 'search',
    placeholder: 'Search topics, definitions, formulas, diagrams…', autocomplete: 'off' });
  const meta = P.el('p', { class: 'se-search-meta', text: 'Searches the content of Modules 1–6.' });
  const results = P.el('ul', { class: 'se-results', 'aria-live': 'polite' });
  search.append(label, input, meta, results);

  let index = [];
  let indexed = false;
  let indexing = null;

  function plainText(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script,style,noscript,svg').forEach(n => n.remove());
    const root = doc.querySelector('#module-content') || doc.body;
    return (root.innerText || root.textContent || '').replace(/\s+/g, ' ').trim();
  }
  async function buildIndex() {
    if (indexed) return;
    if (indexing) return indexing;
    indexing = Promise.all(modules.map(async m => {
      try {
        const response = await fetch(P.moduleUrl(s.id, m.file));
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const html = await response.text();
        return { id: m.id, name: m.name, text: plainText(html) };
      } catch (_) {
        return { id: m.id, name: m.name, text: '', failed: true };
      }
    })).then(items => { index = items; indexed = true; });
    return indexing;
  }
  function excerpt(text, query) {
    const lower = text.toLowerCase(), at = lower.indexOf(query.toLowerCase());
    if (at < 0) return text.slice(0, 170) + (text.length > 170 ? '…' : '');
    const start = Math.max(0, at - 75), end = Math.min(text.length, at + query.length + 100);
    return (start ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }
  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function highlight(text, query) {
    const safe = escapeHtml(text);
    if (!query) return safe;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp('(' + escaped + ')', 'ig'), '<mark>$1</mark>');
  }
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) {
      results.replaceChildren();
      meta.textContent = 'Type at least 2 characters to search Modules 1–6.';
      return;
    }
    meta.textContent = 'Searching all six module files…';
    timer = setTimeout(async () => {
      await buildIndex();
      const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      const matches = index.map(m => {
        const hay = m.text.toLowerCase();
        const score = terms.reduce((n, term) => n + (hay.includes(term) ? 1 : 0), 0);
        return { ...m, score };
      }).filter(m => m.score === terms.length && m.text)
        .sort((a,b) => b.score - a.score);
      results.replaceChildren();
      if (!matches.length) {
        results.append(P.el('li', { class: 'se-no-results', text: 'No matching content found. Try a shorter or different keyword.' }));
      } else {
        matches.forEach(m => {
          const item = P.el('li', { class: 'se-result' });
          const link = P.el('a', { href: P.route(s.id, m.id), text: m.id + ' · ' + m.name });
          const p = document.createElement('p');
          p.innerHTML = highlight(excerpt(m.text, terms[0]), terms[0]);
          item.append(link, p); results.append(item);
        });
      }
      const failed = index.filter(m => m.failed).length;
      meta.textContent = matches.length + ' module' + (matches.length === 1 ? '' : 's') +
        ' matched' + (failed ? ' · ' + failed + ' module file(s) could not be indexed' : '') + '.';
    }, 180);
  });

  P.app.replaceChildren(
    P.el('header', { class: 'page-head' }, [
      P.el('p', { class: 'eyebrow', text: 'PAPER. / SUBJECT' }),
      P.el('h1', { text: s.name }),
      P.el('p', { class: 'subtitle', text: 'Mumbai University · Course 2115111' })
    ]),
    search,
    P.el('h2', { class: 'section-title', text: 'Six syllabus modules' }),
    list,
    P.el('div', { class: 'actions' }, [P.button(P.route(), 'Back to Home')])
  );
  document.title = s.name + ' | PAPER.';
})();