import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { findUsages, termAnchor } from '../lib/glossary';
import { moveItem } from '../lib/util';

export function Glossary() {
  const { data, setData, editing } = useApp();
  const location = useLocation();

  const all = [];
  data.recipes.forEach((r, rid) => (r.glossary || []).forEach((g, gi) => all.push({ rid, gi, r, g })));

  // Arriving from the inline glossary popover's "Vai al glossario" link —
  // scroll to and briefly highlight the term that was tapped/hovered.
  useEffect(() => {
    const term = location.state && location.state.term;
    if (!term) return;
    const el = document.getElementById(termAnchor(term));
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('gloss-entry-highlight');
    const t = setTimeout(() => el.classList.remove('gloss-entry-highlight'), 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  function updateEntry(rid, gi, field, value) {
    setData((prev) => {
      const recipes = prev.recipes.slice();
      const target = { ...recipes[rid] };
      target.glossary = target.glossary.map((g, i) => (i === gi ? { ...g, [field]: value } : g));
      recipes[rid] = target;
      return { ...prev, recipes };
    });
  }
  function removeEntry(rid, gi) {
    setData((prev) => {
      const recipes = prev.recipes.slice();
      const target = { ...recipes[rid] };
      target.glossary = target.glossary.filter((_, i) => i !== gi);
      recipes[rid] = target;
      return { ...prev, recipes };
    });
  }
  function moveEntry(rid, gi, dir) {
    setData((prev) => {
      const recipes = prev.recipes.slice();
      const target = { ...recipes[rid] };
      target.glossary = moveItem(target.glossary, gi, dir);
      recipes[rid] = target;
      return { ...prev, recipes };
    });
  }
  function addEntry() {
    if (!data.recipes.length) return;
    setData((prev) => {
      const recipes = prev.recipes.slice();
      const target = { ...recipes[0] };
      target.glossary = [...(target.glossary || []), { term: 'Termine', def: 'Definizione...' }];
      recipes[0] = target;
      return { ...prev, recipes };
    });
  }

  if (!editing) {
    return (
      <section className="section state-msg">
        <p>
          Il glossario si gestisce in modalità modifica — tocca "Modifica" nel menu, poi torna qui per
          aggiungere o modificare le voci. Per leggere una definizione, tocca il termine sottolineato ovunque
          appaia in una ricetta.
        </p>
        <Link to="/" className="btn btn-outline">
          Torna all'indice
        </Link>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="eyebrow">Riferimenti</div>
      <h1 className="section-heading">Glossario</h1>
      {all.map(({ rid, gi, g }) => {
        const uses = findUsages(g.term, data.recipes);
        return (
          <div className="gloss-entry" id={termAnchor(g.term || 'term')} key={`${rid}-${gi}`}>
            {editing && (
              <div className="sort-btns">
                <button className="sort-btn" onClick={() => moveEntry(rid, gi, -1)}>
                  ↑
                </button>
                <button className="sort-btn" onClick={() => moveEntry(rid, gi, 1)}>
                  ↓
                </button>
              </div>
            )}
            <div className="gloss-entry-content">
              {editing ? (
                <input className="gloss-term-input" value={g.term} onChange={(e) => updateEntry(rid, gi, 'term', e.target.value)} />
              ) : (
                <div className="gloss-term">{g.term}</div>
              )}
              <RichTextEditor
                id={`gloss-${rid}-${gi}`}
                className="gloss-def"
                editing={editing}
                value={g.def}
                onChange={(html) => updateEntry(rid, gi, 'def', html)}
              />
              {uses.length > 0 && (
                <div className="gloss-used-in">
                  <span className="gloss-used-label">Usato in</span>
                  {uses.map((u) => (
                    <Link key={u.id} to={`/ricetta/${u.id}`} className="gloss-recipe-link">
                      {u.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {editing && (
              <button className="entry-del" onClick={() => removeEntry(rid, gi)}>
                ×
              </button>
            )}
          </div>
        );
      })}
      {editing && (
        <button className="add-gloss-row" onClick={addEntry}>
          + Glossario
        </button>
      )}
    </section>
  );
}
