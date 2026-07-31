import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { applyGlossLinks, buildGlossMap, findGlossaryEntry } from '../lib/glossary';
import { moveItem } from '../lib/util';

const CAN_HOVER = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function Recipe() {
  const { id } = useParams();
  const { data, setData, editing, showGlossaryTerm, hideGlossaryTerm } = useApp();
  const navigate = useNavigate();
  const rid = data.recipes.findIndex((r) => r.id === id);
  const recipe = rid >= 0 ? data.recipes[rid] : null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  if (!recipe) {
    return (
      <section className="section state-msg">
        <p>Ricetta non trovata.</p>
        <Link to="/" className="btn btn-outline">
          Torna all'indice
        </Link>
      </section>
    );
  }

  function updateRecipe(fn) {
    setData((prev) => {
      const recipes = prev.recipes.slice();
      const target = { ...recipes[rid] };
      fn(target);
      recipes[rid] = target;
      return { ...prev, recipes };
    });
  }

  function updateField(field, value) {
    updateRecipe((r) => {
      r[field] = value;
    });
  }

  function updateChip(ci, field, value) {
    updateRecipe((r) => {
      r.meta = r.meta.map((c, i) => (i === ci ? { ...c, [field]: value } : c));
    });
  }
  function addChip() {
    const label = window.prompt('Nome del campo:');
    if (label === null) return;
    updateRecipe((r) => {
      r.meta = [...r.meta, { label: label || 'Campo', value: '—', isCat: false }];
    });
  }
  function removeChip(ci) {
    updateRecipe((r) => {
      r.meta = r.meta.filter((_, i) => i !== ci);
    });
  }
  function moveChip(ci, dir) {
    updateRecipe((r) => {
      r.meta = moveItem(r.meta, ci, dir);
    });
  }

  function updateIngredient(iid, field, value) {
    updateRecipe((r) => {
      r.ingredients = r.ingredients.map((ing, i) => (i === iid ? { ...ing, [field]: value } : ing));
    });
  }
  function addIngredient() {
    updateRecipe((r) => {
      r.ingredients = [...r.ingredients, { name: 'Ingrediente', qty: '—', note: '', tags: [], group: '' }];
    });
  }
  function removeIngredient(iid) {
    updateRecipe((r) => {
      r.ingredients = r.ingredients.filter((_, i) => i !== iid);
    });
  }
  function moveIngredient(iid, dir) {
    updateRecipe((r) => {
      r.ingredients = moveItem(r.ingredients, iid, dir);
    });
  }
  function addTag(iid, tag) {
    updateRecipe((r) => {
      r.ingredients = r.ingredients.map((ing, i) => (i === iid ? { ...ing, tags: [...ing.tags, tag] } : ing));
    });
  }
  function removeTag(iid, ti) {
    updateRecipe((r) => {
      r.ingredients = r.ingredients.map((ing, i) => (i === iid ? { ...ing, tags: ing.tags.filter((_, t) => t !== ti) } : ing));
    });
  }

  function addTip() {
    updateRecipe((r) => {
      r.tips = [...(r.tips || []), { text: 'Suggerimento...' }];
    });
  }
  function updateTip(ti, text) {
    updateRecipe((r) => {
      r.tips = r.tips.map((t, i) => (i === ti ? { ...t, text } : t));
    });
  }
  function removeTip(ti) {
    updateRecipe((r) => {
      r.tips = r.tips.filter((_, i) => i !== ti);
    });
  }
  function moveTip(ti, dir) {
    updateRecipe((r) => {
      r.tips = moveItem(r.tips, ti, dir);
    });
  }

  function deleteRecipe() {
    if (!window.confirm(`Eliminare "${recipe.title}"?`)) return;
    setData((prev) => ({ ...prev, recipes: prev.recipes.filter((_, i) => i !== rid) }));
    navigate('/');
  }

  function openGlossFromEvent(e) {
    const el = e.target.closest('.gloss-link');
    if (!el) return;
    const entry = findGlossaryEntry(el.dataset.term, data.recipes);
    if (!entry) return;
    showGlossaryTerm(entry, el.getBoundingClientRect(), true);
  }
  function hoverInGloss(e) {
    if (!CAN_HOVER) return;
    const el = e.target.closest('.gloss-link');
    if (!el) return;
    const entry = findGlossaryEntry(el.dataset.term, data.recipes);
    if (!entry) return;
    showGlossaryTerm(entry, el.getBoundingClientRect(), false);
  }
  function hoverOutGloss(e) {
    if (!CAN_HOVER) return;
    const from = e.target.closest('.gloss-link');
    if (!from) return;
    if (e.relatedTarget && from.contains(e.relatedTarget)) return;
    hideGlossaryTerm();
  }

  const gMap = editing ? {} : buildGlossMap(data.recipes);
  const hasAuthor = !!(recipe.author && recipe.author.trim());
  const prev = data.recipes[rid - 1];
  const next = data.recipes[rid + 1];

  let lastGroup = null;

  return (
    <section className="section">
      <div className="recipe-crumb">
        <Link to="/" className="recipe-back">
          ← Indice
        </Link>
        {editing && (
          <button className="del-recipe-btn" style={{ marginBottom: 0 }} onClick={deleteRecipe}>
            Elimina ricetta
          </button>
        )}
      </div>
      <div className="eyebrow">
        {editing ? (
          <input
            className="chip-label-input"
            style={{ display: 'inline', width: 'auto', color: 'var(--magenta)', textAlign: 'left' }}
            value={recipe.categoryLabel}
            onChange={(e) => updateField('categoryLabel', e.target.value)}
          />
        ) : (
          recipe.categoryLabel
        )}
        <span className="eyebrow-page"> · p.{rid + 1}</span>
      </div>

      {editing ? (
        <input className="recipe-title" value={recipe.title} onChange={(e) => updateField('title', e.target.value)} />
      ) : (
        <h1 className="recipe-title">{recipe.title}</h1>
      )}

      <p className="recipe-author">
        <span style={{ opacity: 0.55, fontStyle: 'italic', fontSize: 14 }}>Dalla cucina di</span>
        {editing ? (
          <input className="author-input" value={recipe.author} onChange={(e) => updateField('author', e.target.value)} />
        ) : (
          <span className={`author-span${hasAuthor ? ' has-author' : ''}`} style={{ borderBottom: hasAuthor ? 'none' : '1px solid rgba(2,178,251,.35)', minWidth: 80, textAlign: 'right' }}>
            {recipe.author}
          </span>
        )}
      </p>

      <div className="meta-row">
        {recipe.meta.map((c, ci) => (
          <div className="chip" key={ci}>
            {editing ? (
              <>
                <input className="chip-label-input" value={c.label} onChange={(e) => updateChip(ci, 'label', e.target.value)} />
                <input className={`chip-val-input${c.isCat ? ' is-cat' : ''}`} value={c.value} onChange={(e) => updateChip(ci, 'value', e.target.value)} />
                <button className="chip-del" onClick={() => removeChip(ci)}>
                  ×
                </button>
                <div className="chip-sort">
                  <button className="chip-sort-btn" onClick={() => moveChip(ci, -1)}>
                    ←
                  </button>
                  <button className="chip-sort-btn" onClick={() => moveChip(ci, 1)}>
                    →
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="chip-label">{c.label}</span>
                <span className={`chip-val${c.isCat ? ' is-cat' : ''}`}>{c.value}</span>
              </>
            )}
          </div>
        ))}
        {editing && (
          <div className="chip chip-ghost" onClick={addChip}>
            <span className="chip-ghost-plus">+</span>
            <span className="chip-label">Campo</span>
          </div>
        )}
      </div>

      <div className="recipe-body" onClick={openGlossFromEvent} onMouseOver={hoverInGloss} onMouseOut={hoverOutGloss}>
        <div>
          <div className="col-label">Ingredienti</div>
          <div className="ing-list">
            {recipe.ingredients.map((ing, iid) => {
              const grp = ing.group || '';
              let header = null;
              if (!editing && grp !== lastGroup && grp) {
                header = (
                  <div className="ing-group-header" key={`grp-${iid}`}>
                    <span className="ing-group-name">{grp}</span>
                  </div>
                );
              }
              lastGroup = grp;
              return (
                <div key={iid}>
                  {header}
                  <div className="ing-row">
                    {editing && (
                      <div className="sort-btns">
                        <button className="sort-btn" onClick={() => moveIngredient(iid, -1)}>
                          ↑
                        </button>
                        <button className="sort-btn" onClick={() => moveIngredient(iid, 1)}>
                          ↓
                        </button>
                      </div>
                    )}
                    <div className="ing-info">
                      {editing && (
                        <input
                          className="ing-group-input"
                          placeholder="Gruppo..."
                          value={grp}
                          onChange={(e) => updateIngredient(iid, 'group', e.target.value)}
                        />
                      )}
                      <div className="ing-top">
                        {editing ? (
                          <input className="ing-name-input" value={ing.name} onChange={(e) => updateIngredient(iid, 'name', e.target.value)} />
                        ) : (
                          <span className="ing-name" dangerouslySetInnerHTML={{ __html: applyGlossLinks(ing.name, gMap) }} />
                        )}
                        {ing.tags.map((tag, ti) => (
                          <span className="ing-tag" key={ti}>
                            {tag}
                            {editing && (
                              <button className="tag-del" onClick={() => removeTag(iid, ti)}>
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                        {editing && (
                          <input
                            className="tag-new-input"
                            placeholder="+ tag"
                            autoComplete="off"
                            onKeyDown={(e) => {
                              if (e.key !== 'Enter' && e.key !== ',') return;
                              e.preventDefault();
                              const v = e.target.value.trim().replace(/,/g, '');
                              if (!v) return;
                              addTag(iid, v);
                              e.target.value = '';
                            }}
                          />
                        )}
                      </div>
                      {editing ? (
                        <input
                          className="ing-note-input"
                          placeholder="Nota..."
                          value={ing.note}
                          onChange={(e) => updateIngredient(iid, 'note', e.target.value)}
                        />
                      ) : (
                        ing.note && <span className="ing-subnote">{ing.note}</span>
                      )}
                    </div>
                    {editing ? (
                      <input className="ing-qty-input" value={ing.qty} onChange={(e) => updateIngredient(iid, 'qty', e.target.value)} />
                    ) : (
                      <span className="ing-qty">{ing.qty}</span>
                    )}
                    {editing && (
                      <button className="row-del" onClick={() => removeIngredient(iid)}>
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {editing && (
            <button className="add-row-btn" onClick={addIngredient}>
              + Ingrediente
            </button>
          )}
        </div>
        <div>
          <div className="col-label">Procedimento</div>
          <RichTextEditor
            id={`${recipe.id}-proc`}
            className="procedure-prose"
            editing={editing}
            value={editing ? recipe.procedure : applyGlossLinks(recipe.procedure, gMap)}
            onChange={(html) => updateField('procedure', html)}
            placeholder="Scrivi il procedimento..."
          />
        </div>
      </div>

      {(recipe.tips && recipe.tips.length > 0) || editing ? (
        <div className="tips-section">
          {(recipe.tips || []).map((t, ti) => (
            <div className="tip-entry" key={ti}>
              {editing && (
                <div className="sort-btns">
                  <button className="sort-btn" onClick={() => moveTip(ti, -1)}>
                    ↑
                  </button>
                  <button className="sort-btn" onClick={() => moveTip(ti, 1)}>
                    ↓
                  </button>
                </div>
              )}
              <div className="tip-entry-content">
                <div className="tip-label">Suggerimento</div>
                {editing ? (
                  <input className="tip-text-input" value={t.text} onChange={(e) => updateTip(ti, e.target.value)} />
                ) : (
                  <p className="tip-text">{t.text}</p>
                )}
              </div>
              {editing && (
                <button className="entry-del" onClick={() => removeTip(ti)}>
                  ×
                </button>
              )}
            </div>
          ))}
          {editing && (
            <button className="add-row-btn" onClick={addTip}>
              + Suggerimento
            </button>
          )}
        </div>
      ) : null}

      <div className="enjoy-sep">
        {editing ? (
          <input
            className="chip-val-input"
            style={{ display: 'inline', width: 80, textAlign: 'center' }}
            value={recipe.enjoy}
            onChange={(e) => updateField('enjoy', e.target.value)}
          />
        ) : (
          <span className="enjoy-emoji">{recipe.enjoy}</span>
        )}
      </div>

      <div className="recipe-pager">
        {prev ? (
          <Link to={`/ricetta/${prev.id}`}>
            ← Precedente
            <span className="pg-title">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/ricetta/${next.id}`} className="next">
            Successiva →<span className="pg-title">{next.title}</span>
          </Link>
        )}
      </div>
    </section>
  );
}
