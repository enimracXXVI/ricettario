import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchRecipesRaw, fetchRecipesWithSha, saveRecipes, verifyToken } from '../lib/github';
import { DRAFT_STORAGE_KEY, THEME_STORAGE_KEY, TOKEN_STORAGE_KEY } from '../config';

const AppContext = createContext(null);

const EMPTY_DATA = { recipes: [], catOrder: [] };

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'dark');
  const [data, setDataRaw] = useState(null);
  const [sha, setSha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [token, setTokenRaw] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [toast, setToast] = useState(null);
  const [pendingDraft, setPendingDraft] = useState(null);

  const lastLoadedRef = useRef(null); // { data, sha } snapshot to revert to on cancel
  const draftTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const remote = await fetchRecipesRaw();
      const next = remote || EMPTY_DATA;
      setDataRaw(next);
      lastLoadedRef.current = { data: next, sha: null };
      setSha(null);
    } catch (e) {
      setLoadError(e.message || 'Errore di caricamento');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatest();
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) setPendingDraft(JSON.parse(raw));
    } catch {
      /* ignore corrupt draft */
    }
  }, [loadLatest]);

  const setData = useCallback((updater) => {
    setDataRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev || EMPTY_DATA) : updater;
      return next;
    });
  }, []);

  // Debounced local draft autosave while editing — the safety net for crashes/lost connectivity.
  useEffect(() => {
    if (!editing || !data) return;
    clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ts: Date.now(), data }));
      } catch {
        /* storage full/unavailable — nothing we can do client-side */
      }
    }, 700);
    return () => clearTimeout(draftTimerRef.current);
  }, [data, editing]);

  const setToken = useCallback((t) => {
    setTokenRaw(t);
    if (t) localStorage.setItem(TOKEN_STORAGE_KEY, t);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const checkAndStoreToken = useCallback(
    async (t) => {
      const ok = await verifyToken(t);
      if (ok) setToken(t);
      return ok;
    },
    [setToken]
  );

  const startEditing = useCallback(() => {
    if (!token) return false;
    lastLoadedRef.current = { data, sha };
    setEditing(true);
    return true;
  }, [token, data, sha]);

  const cancelEditing = useCallback(() => {
    if (lastLoadedRef.current) {
      setDataRaw(lastLoadedRef.current.data);
      setSha(lastLoadedRef.current.sha);
    }
    setEditing(false);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setPendingDraft(null);
  }, []);

  const save = useCallback(
    async (force = false) => {
      if (!token || !data) return;
      setSaving(true);
      try {
        const result = await saveRecipes({ token, data, knownSha: sha, force });
        setSha(result.sha);
        lastLoadedRef.current = { data, sha: result.sha };
        setEditing(false);
        setConflict(null);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setPendingDraft(null);
        showToast('Salvato su GitHub ✓');
      } catch (e) {
        if (e.code === 'CONFLICT') {
          setConflict({ latestSha: e.latestSha, latestData: e.latestData });
        } else {
          showToast(e.message || 'Errore durante il salvataggio');
        }
      } finally {
        setSaving(false);
      }
    },
    [token, data, sha, showToast]
  );

  const resolveConflictKeepMine = useCallback(() => save(true), [save]);

  const resolveConflictTakeTheirs = useCallback(() => {
    if (!conflict) return;
    setDataRaw(conflict.latestData);
    setSha(conflict.latestSha);
    lastLoadedRef.current = { data: conflict.latestData, sha: conflict.latestSha };
    setConflict(null);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setPendingDraft(null);
    showToast('Caricata la versione più recente');
  }, [conflict, showToast]);

  const restoreDraft = useCallback(() => {
    if (!pendingDraft) return;
    setDataRaw(pendingDraft.data);
    (async () => {
      // We don't know the sha the draft was based on; refresh it via an authenticated
      // read if we have a token so a subsequent save can still conflict-check correctly.
      if (token) {
        try {
          const { sha: freshSha } = await fetchRecipesWithSha(token);
          setSha(freshSha);
        } catch {
          /* keep editing even if this lookup fails */
        }
      }
    })();
    setEditing(true);
    setPendingDraft(null);
  }, [pendingDraft, token]);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setPendingDraft(null);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
      data,
      setData,
      loading,
      loadError,
      reload: loadLatest,
      editing,
      startEditing,
      cancelEditing,
      token,
      hasToken: !!token,
      checkAndStoreToken,
      clearToken: () => setToken(''),
      saving,
      save,
      conflict,
      resolveConflictKeepMine,
      resolveConflictTakeTheirs,
      toast,
      showToast,
      pendingDraft,
      restoreDraft,
      discardDraft,
    }),
    [
      theme,
      data,
      setData,
      loading,
      loadError,
      loadLatest,
      editing,
      startEditing,
      cancelEditing,
      token,
      checkAndStoreToken,
      setToken,
      saving,
      save,
      conflict,
      resolveConflictKeepMine,
      resolveConflictTakeTheirs,
      toast,
      showToast,
      pendingDraft,
      restoreDraft,
      discardDraft,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
