import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function GlossaryPopover() {
  const { glossaryPopup, hideGlossaryTerm } = useApp();
  const navigate = useNavigate();
  const boxRef = useRef(null);

  useEffect(() => {
    if (!glossaryPopup) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') hideGlossaryTerm();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [glossaryPopup, hideGlossaryTerm]);

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
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              hideGlossaryTerm();
              navigate('/glossario', { state: { term } });
            }}
          >
            Vai al glossario →
          </button>
          <button type="button" className="btn btn-outline" onClick={hideGlossaryTerm}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
