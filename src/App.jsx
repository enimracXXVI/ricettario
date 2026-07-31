import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { NavBar } from './components/NavBar';
import { Toast } from './components/Toast';
import { FormatToolbar } from './components/FormatToolbar';
import { TokenModal } from './components/TokenModal';
import { NewRecipeModal } from './components/NewRecipeModal';
import { DraftBanner, ConflictBanner } from './components/Banners';
import { GlossaryPopover } from './components/GlossaryPopover';
import { Home } from './pages/Home';
import { Recipe } from './pages/Recipe';
import { Glossary } from './pages/Glossary';

function Shell() {
  const { data, loading, loadError, reload, hasToken } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newRecipeOpen, setNewRecipeOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // PWA shortcut "Nuova ricetta" lands here with ?nuova=1
  useEffect(() => {
    if (searchParams.get('nuova') !== '1' || loading) return;
    setSearchParams({}, { replace: true });
    if (hasToken) setNewRecipeOpen(true);
    else setSettingsOpen(true);
  }, [searchParams, setSearchParams, hasToken, loading]);

  return (
    <>
      <NavBar onNewRecipe={() => setNewRecipeOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />
      <DraftBanner />
      <ConflictBanner />
      <div className="wrap">
        {loading && (
          <div className="state-msg">
            <p>Carico le ricette…</p>
          </div>
        )}
        {!loading && loadError && (
          <div className="state-msg">
            <p>{loadError}</p>
            <button className="btn btn-outline" onClick={reload}>
              Riprova
            </button>
          </div>
        )}
        {!loading && !loadError && data && (
          <Routes>
            <Route path="/" element={<Home onNewRecipe={() => setNewRecipeOpen(true)} />} />
            <Route path="/ricetta/:id" element={<Recipe />} />
            <Route path="/glossario" element={<Glossary />} />
          </Routes>
        )}
      </div>
      <FormatToolbar />
      <GlossaryPopover />
      <Toast />
      <TokenModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <NewRecipeModal
        open={newRecipeOpen}
        onClose={() => setNewRecipeOpen(false)}
        onCreated={(id) => navigate(`/ricetta/${id}`)}
      />
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
