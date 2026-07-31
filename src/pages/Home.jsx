import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getCatOrder, moveItem } from '../lib/util';

export function Home({ onNewRecipe }) {
  const { data, setData, editing } = useApp();
  const order = getCatOrder(data);

  const groups = {};
  order.forEach((c) => (groups[c] = []));
  data.recipes.forEach((r, rid) => {
    if (!groups[r.categoryLabel]) groups[r.categoryLabel] = [];
    groups[r.categoryLabel].push({ r, rid });
  });

  function moveCat(ci, dir) {
    setData((prev) => {
      const ord = getCatOrder(prev);
      const j = ci + dir;
      if (j < 0 || j >= ord.length) return prev;
      const a = prev.catOrder.indexOf(ord[ci]);
      const b = prev.catOrder.indexOf(ord[j]);
      const nextOrder = prev.catOrder.slice();
      if (a >= 0 && b >= 0) [nextOrder[a], nextOrder[b]] = [nextOrder[b], nextOrder[a]];
      return { ...prev, catOrder: nextOrder };
    });
  }

  function moveRecipe(rid, dir) {
    setData((prev) => ({ ...prev, recipes: moveItem(prev.recipes, rid, dir) }));
  }

  return (
    <section className="section">
      <div className="eyebrow">Ricettario</div>
      <h1 className="section-heading">Indice</h1>
      <div className="cat-grid">
        {order.map((cat, ci) => (
          <div className="cat-card" key={cat}>
            {editing && (
              <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                <button className="sort-btn" onClick={() => moveCat(ci, -1)}>
                  ↑ cat
                </button>
                <button className="sort-btn" onClick={() => moveCat(ci, 1)}>
                  ↓ cat
                </button>
              </div>
            )}
            <div className="cat-card-label">{cat}</div>
            {(groups[cat] || []).length === 0 && <div className="cat-empty">Nessuna ricetta</div>}
            {(groups[cat] || []).map(({ r, rid }) => (
              <div className="cat-entry" key={r.id}>
                <Link to={`/ricetta/${r.id}`} className="cat-entry-link">
                  {r.title}
                </Link>
                <div className="cat-entry-right">
                  <span className="cat-pg">p.{rid + 1}</span>
                  {editing && (
                    <>
                      <button className="sort-btn" onClick={() => moveRecipe(rid, -1)}>
                        ↑
                      </button>
                      <button className="sort-btn" onClick={() => moveRecipe(rid, 1)}>
                        ↓
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {editing && (
        <button className="add-recipe-btn" onClick={onNewRecipe}>
          + Nuova Ricetta
        </button>
      )}
    </section>
  );
}
