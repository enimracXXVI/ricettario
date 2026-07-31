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

// Wraps plain-text occurrences of glossary terms in a <span class="gloss-link">
// (never a real href — a HashRouter owns the URL's # fragment for routing, so an
// in-page href="#gloss-..." anchor gets swallowed as a broken route instead of
// jumping to the term). The click/hover behaviour is wired up by the caller via
// event delegation, opening an inline popover instead of navigating away.
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
      return e
        ? `<span class="gloss-link" tabindex="0" role="button" data-term="${e.display}">${m}</span>`
        : m;
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

// Full entry (definition + usages) for a term, looked up by display name —
// used when opening the inline popover from a rendered gloss-link span.
export function findGlossaryEntry(term, recipes) {
  const key = (term || '').trim().toLowerCase();
  if (!key) return null;
  for (const r of recipes) {
    const found = (r.glossary || []).find((g) => (g.term || '').trim().toLowerCase() === key);
    if (found) return { term: found.term, def: found.def, usedIn: findUsages(found.term, recipes) };
  }
  return null;
}
