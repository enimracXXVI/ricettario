import { useApp } from '../context/AppContext';

function timeAgo(ts) {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return 'pochi istanti fa';
  if (mins === 1) return '1 minuto fa';
  if (mins < 60) return `${mins} minuti fa`;
  const hours = Math.round(mins / 60);
  return hours === 1 ? '1 ora fa' : `${hours} ore fa`;
}

export function DraftBanner() {
  const { pendingDraft, restoreDraft, discardDraft } = useApp();
  if (!pendingDraft) return null;
  return (
    <div className="banner">
      <p>Trovata una bozza non salvata su GitHub, di {timeAgo(pendingDraft.ts)}. Vuoi recuperarla?</p>
      <div className="banner-actions">
        <button className="btn btn-ghost" onClick={discardDraft}>
          Scarta
        </button>
        <button className="btn btn-primary" onClick={restoreDraft}>
          Ripristina bozza
        </button>
      </div>
    </div>
  );
}

export function ConflictBanner() {
  const { conflict, resolveConflictKeepMine, resolveConflictTakeTheirs } = useApp();
  if (!conflict) return null;
  return (
    <div className="banner">
      <p>Qualcuno ha salvato altre modifiche nel frattempo. Le tue modifiche in corso sono al sicuro qui.</p>
      <div className="banner-actions">
        <button className="btn btn-ghost" onClick={resolveConflictTakeTheirs}>
          Carica la loro versione
        </button>
        <button className="btn btn-primary" onClick={resolveConflictKeepMine}>
          Salva comunque le mie
        </button>
      </div>
    </div>
  );
}
