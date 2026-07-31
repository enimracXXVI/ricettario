import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useEscapeToClose } from '../lib/useEscapeToClose';

function NavLinks({ onNavigate }) {
  return (
    <div className="nav-links">
      <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={onNavigate} end>
        Indice
      </NavLink>
      <NavLink to="/glossario" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={onNavigate}>
        Glossario
      </NavLink>
    </div>
  );
}

function NavActions({ onOpenSettings, onNewRecipe, onNavigate }) {
  const { theme, toggleTheme, editing, hasToken, startEditing, cancelEditing, save, saving } = useApp();

  function handleModifica() {
    if (!hasToken) {
      onOpenSettings();
    } else {
      startEditing();
    }
    onNavigate();
  }

  return (
    <div className="nav-actions">
      <button className="btn-theme" onClick={toggleTheme} title="Cambia tema">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <button className="btn-theme" onClick={onOpenSettings} title="Impostazioni">
        ⚙️
      </button>
      {editing ? (
        <>
          <button
            className="btn btn-outline"
            onClick={() => {
              onNewRecipe();
              onNavigate();
            }}
          >
            + Ricetta
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              cancelEditing();
              onNavigate();
            }}
          >
            Annulla
          </button>
          <button
            className="btn btn-primary"
            disabled={saving}
            onClick={() => {
              save();
              onNavigate();
            }}
          >
            {saving ? 'Salvo…' : 'Salva'}
          </button>
        </>
      ) : (
        <button className="btn btn-outline" onClick={handleModifica}>
          Modifica
        </button>
      )}
    </div>
  );
}

export function NavBar({ onNewRecipe, onOpenSettings }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEscapeToClose(open, close);

  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <NavLink to="/" className="nav-brand">
          Il mio Ricettario
        </NavLink>
        <button className="nav-burger" aria-label="Apri menu" onClick={() => setOpen(true)}>
          ☰
        </button>
        {/* Desktop: plain inline bar, always visible via CSS at wider widths. */}
        <div className="nav-menu">
          <NavLinks onNavigate={() => {}} />
          <NavActions onOpenSettings={onOpenSettings} onNewRecipe={onNewRecipe} onNavigate={() => {}} />
        </div>
      </div>

      {/* Mobile: full-height drawer portaled to <body> so it isn't clipped by
          .topnav's backdrop-filter, which creates a containing block for any
          position:fixed descendant and was collapsing the drawer/backdrop to
          the navbar's own height. */}
      {open &&
        createPortal(
          <>
            <div className="nav-backdrop" onClick={close} />
            <div className="nav-drawer">
              <button className="nav-drawer-close" aria-label="Chiudi menu" onClick={close}>
                ✕
              </button>
              <NavLinks onNavigate={close} />
              <NavActions onOpenSettings={onOpenSettings} onNewRecipe={onNewRecipe} onNavigate={close} />
            </div>
          </>,
          document.body
        )}
    </nav>
  );
}
