import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function NavBar({ onNewRecipe, onOpenSettings }) {
  const { theme, toggleTheme, editing, hasToken, startEditing, cancelEditing, save, saving } = useApp();
  const [open, setOpen] = useState(false);

  function handleModifica() {
    if (!hasToken) {
      onOpenSettings();
      return;
    }
    startEditing();
    setOpen(false);
  }

  function handleNewRecipe() {
    onNewRecipe();
    setOpen(false);
  }

  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <NavLink to="/" className="nav-brand" onClick={() => setOpen(false)}>
          Il mio Ricettario
        </NavLink>
        <button className="nav-burger" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
          {open ? '✕' : '☰'}
        </button>
        <div className={`nav-menu ${open ? 'open' : ''}`}>
          <div className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)} end>
              Indice
            </NavLink>
            <NavLink to="/glossario" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)}>
              Glossario
            </NavLink>
          </div>
          <div className="nav-actions">
            <button className="btn-theme" onClick={toggleTheme} title="Cambia tema">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button className="btn-theme" onClick={onOpenSettings} title="Impostazioni">
              ⚙️
            </button>
            {editing ? (
              <>
                <button className="btn btn-outline" onClick={handleNewRecipe}>
                  + Ricetta
                </button>
                <button className="btn btn-ghost" onClick={() => cancelEditing()}>
                  Annulla
                </button>
                <button className="btn btn-primary" disabled={saving} onClick={() => save()}>
                  {saving ? 'Salvo…' : 'Salva'}
                </button>
              </>
            ) : (
              <button className="btn btn-outline" onClick={handleModifica}>
                Modifica
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
