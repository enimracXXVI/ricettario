import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useBodyScrollLock } from '../lib/useBodyScrollLock';

export function GlossaryPopover() {
  const { glossaryPopup, hideGlossaryTerm, editing } = useApp();
  const navigate = useNavigate();
  const boxRef = useRef(null);

  const pinned = !!(glossaryPopup && glossaryPopup.pinned);
  useBodyScrollLock(pinned);

  useEffect(() => {
    if (!glossaryPopup) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') hideGlossaryTerm();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [glossaryPopup, hideGlossaryTerm]);

  // A hover preview (not pinned) is anchored to a term's on-screen position at
  // open time; if the page scrolls it would drift away from that term, so just
  // dismiss it instead of trying to keep it glued to a moving target.
  useEffect(() => {
    if (!glossaryPopup || pinned) return;
    function onScroll() {
      hideGlossaryTerm();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [glossaryPopup, pinned, hideGlossaryTerm]);

  if (!glossaryPopup) return null;

  const isMobile = window.innerWidth < 760;
  const { term, def, usedIn, rect } = glossaryPopup;

  const style = isMobile
    ? {}
    : (() => {
        const w = 300;
        const left = Math.min(Math.max(w / 2 + 8, rect.left + rect.width / 2), window.innerWidth - w / 2 - 8);
        const top = Math.min(rect.bottom + 10, window.innerHeight - 220);
        return { left, top };
      })();

  return (
    <div className="gloss-popover-backdrop" onMouseDown={hideGlossaryTerm}>
      <div
        ref={boxRef}
        className={`gloss-popover ${isMobile ? 'mobile' : ''}`}
        style={style}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="gloss-popover-term">{term}</div>
        <div className="gloss-popover-def" dangerouslySetInnerHTML={{ __html: def }} />
        {usedIn && usedIn.length > 0 && (
          <div className="gloss-used-in">
            <span className="gloss-used-label">Usato in</span>
            {usedIn.map((r) => (
              <button
                key={r.id}
                type="button"
                className="gloss-recipe-link gloss-recipe-btn"
                onClick={() => {
                  hideGlossaryTerm();
                  navigate(`/ricetta/${r.id}`);
                }}
              >
                {r.title}
              </button>
            ))}
          </div>
        )}
        <div className="gloss-popover-actions">
          {editing && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                hideGlossaryTerm();
                navigate('/glossario', { state: { term } });
              }}
            >
              Modifica nel glossario →
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={hideGlossaryTerm}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
