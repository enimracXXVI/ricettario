import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { emptyRecipe, getCatOrder, newRecipeId } from '../lib/util';
import { useEscapeToClose } from '../lib/useEscapeToClose';

const NEW_CAT = '__new__';

export function NewRecipeModal({ open, onClose, onCreated }) {
  const { data, setData, startEditing, editing } = useApp();
  const cats = data ? getCatOrder(data) : [];
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState('');
  const [customCat, setCustomCat] = useState('');
  const [error, setError] = useState('');

  useEscapeToClose(open, onClose);

  useEffect(() => {
    if (open) {
      setTitle('');
      setCustomCat('');
      setError('');
      setCat(cats[0] || NEW_CAT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function handleCreate() {
    const t = title.trim();
    const categoryLabel = cat === NEW_CAT ? customCat.trim() : cat.trim();
    if (!t) {
      setError('Serve un titolo.');
      return;
    }
    if (!categoryLabel) {
      setError('Serve una categoria.');
      return;
    }
    if (!editing) startEditing();
    const id = newRecipeId();
    setData((prev) => ({
      ...prev,
      catOrder: prev.catOrder.includes(categoryLabel) ? prev.catOrder : [...prev.catOrder, categoryLabel],
      recipes: [...prev.recipes, emptyRecipe(id, t, categoryLabel)],
    }));
    onClose();
    onCreated(id);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">Nuova ricetta</div>
        <div className="modal-field">
          <label className="modal-label" htmlFor="new-title">
            Titolo
          </label>
          <input
            id="new-title"
            className="modal-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>
        <div className="modal-field">
          <label className="modal-label" htmlFor="new-cat">
            Categoria
          </label>
          <select id="new-cat" className="modal-select" value={cat} onChange={(e) => setCat(e.target.value)}>
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NEW_CAT}>+ Nuova categoria…</option>
          </select>
        </div>
        {cat === NEW_CAT && (
          <div className="modal-field">
            <label className="modal-label" htmlFor="new-cat-custom">
              Nome nuova categoria
            </label>
            <input
              id="new-cat-custom"
              className="modal-input"
              value={customCat}
              onChange={(e) => setCustomCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
        )}
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annulla
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCreate}>
            Crea
          </button>
        </div>
      </div>
    </div>
  );
}
