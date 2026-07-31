import { useState } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { REPO_NAME, REPO_OWNER } from '../config';
import { useEscapeToClose } from '../lib/useEscapeToClose';

export function TokenModal({ open, onClose }) {
  const { hasToken, token, checkAndStoreToken, clearToken, showToast } = useApp();
  const [value, setValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState(null);
  const [pasteError, setPasteError] = useState('');

  useEscapeToClose(open, onClose);

  if (!open) return null;

  async function handlePaste() {
    setPasteError('');
    try {
      const text = await navigator.clipboard.readText();
      if (text) setValue(text.trim());
    } catch {
      setPasteError('Impossibile leggere gli appunti — incolla manualmente nel campo.');
    }
  }

  async function handleSave() {
    const v = value.trim();
    if (!v) return;
    setChecking(true);
    setError('');
    try {
      const ok = await checkAndStoreToken(v);
      if (ok) {
        showToast('Token salvato su questo dispositivo ✓');
        setValue('');
        onClose();
      } else {
        setError('Token non valido, oppure senza permessi di scrittura su questo repository.');
      }
    } catch (e) {
      setError(e.message || 'Errore di verifica del token.');
    } finally {
      setChecking(false);
    }
  }

  async function handleShowQr() {
    if (qrUrl) {
      setQrUrl(null);
      return;
    }
    const url = await QRCode.toDataURL(token, { margin: 1, width: 240 });
    setQrUrl(url);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">Accesso a GitHub</div>
        <p className="modal-help">
          Per salvare le modifiche serve un Personal Access Token (fine-grained) con accesso in scrittura al solo
          repository <strong>{REPO_OWNER}/{REPO_NAME}</strong>. Va aggiunto una volta per dispositivo/browser — resta
          salvato solo in locale.
          <br />
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">
            Crea un token su GitHub →
          </a>{' '}
          (permesso richiesto: <em>Contents: Read and write</em>, limitato a questo repository).
        </p>

        {hasToken && (
          <div className="modal-field">
            <span className="modal-label">Stato attuale</span>
            <p style={{ fontSize: 13, marginBottom: 10 }}>Un token è già salvato su questo dispositivo.</p>
            <button type="button" className="btn btn-outline btn-block" onClick={handleShowQr}>
              {qrUrl ? 'Nascondi QR' : 'Mostra come QR per un altro dispositivo'}
            </button>
            {qrUrl && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <img src={qrUrl} alt="QR del token" width={240} height={240} style={{ borderRadius: 10 }} />
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                  Inquadra con la fotocamera dell'altro dispositivo: di solito propone di copiare il testo — poi
                  incollalo qui sotto con "Incolla". Non condividere questo QR pubblicamente.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="modal-field">
          <label className="modal-label" htmlFor="gh-token">
            {hasToken ? 'Sostituisci token' : 'Nuovo token'}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="gh-token"
              type="password"
              autoComplete="off"
              className="modal-input"
              placeholder="github_pat_…"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button type="button" className="btn btn-outline" style={{ flexShrink: 0 }} onClick={handlePaste}>
              Incolla
            </button>
          </div>
          {pasteError && <div className="modal-error">{pasteError}</div>}
        </div>
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          {hasToken && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                clearToken();
                setQrUrl(null);
                showToast('Token rimosso da questo dispositivo');
              }}
            >
              Rimuovi token
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Chiudi
          </button>
          <button type="button" className="btn btn-primary" disabled={checking || !value.trim()} onClick={handleSave}>
            {checking ? 'Verifico…' : 'Verifica e salva'}
          </button>
        </div>
      </div>
    </div>
  );
}
