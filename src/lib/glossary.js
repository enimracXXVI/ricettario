export function termAnchor(term) {
  return 'gloss-' + term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function buildGlossMap(recipes) {
  const map = {};
  recipes.forEach((r) => {
    (r.glossary || []).forEach((g) => {
      const key = (g.term || '').trim().toLowerCase();
      if (key && !map[key]) map[key] = { anchor: termAnchor(g.term.trim()), display: g.term.trim() };
    });
  });
  return map;
}

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Wraps plain-text occurrences of glossary terms in <a href="#gloss-...">
// while leaving existing HTML tags untouched.
export function applyGlossLinks(html, map) {
  if (html == null) return '';
  const terms = Object.keys(map);
  if (!terms.length) return html;
  terms.sort((a, b) => b.length - a.length);
  const re = new RegExp('\\b(' + terms.map(escRe).join('|') + ')\\b', 'gi');
  return String(html).replace(/(<[^>]+>|[^<]+)/g, (seg) => {
    if (seg.startsWith('<')) return seg;
    return seg.replace(re, (m) => {
      const e = map[m.toLowerCase()];
      return e ? `<a href="#${e.anchor}" class="gloss-link">${m}</a>` : m;
    });
  });
}

// Recipes (title/id) in which a glossary term actually appears.
export function findUsages(term, recipes) {
  const key = (term || '').trim().toLowerCase();
  if (!key) return [];
  return recipes.filter((r) => {
    const inIng = r.ingredients.some((ing) => ing.name.toLowerCase().includes(key));
    const procText = (r.procedure || '').replace(/<[^>]+>/g, '').toLowerCase();
    return inIng || procText.includes(key);
  });
}
