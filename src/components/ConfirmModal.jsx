import { useEscapeToClose } from '../lib/useEscapeToClose';
import { useBodyScrollLock } from '../lib/useBodyScrollLock';

export function ConfirmModal({ open, title, message, confirmLabel = 'Conferma', onConfirm, onCancel }) {
  useEscapeToClose(open, onCancel);
  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-box">
        <div className="modal-title">{title}</div>
        <p className="modal-help" style={{ marginBottom: 24 }}>
          {message}
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Annulla
          </button>
          <button type="button" className="btn btn-danger-solid" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
