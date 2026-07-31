import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

const COLORS = [
  { c: '#02b2fb', label: 'Ciano' },
  { c: '#ff00aa', label: 'Magenta' },
  { c: '#9cfe00', label: 'Lime' },
  { c: '#d4eaff', label: 'Testo' },
];

function isFmtField(node) {
  while (node) {
    if (node.nodeType === 1 && node.classList && node.classList.contains('rte')) return true;
    node = node.parentElement;
  }
  return false;
}

export function FormatToolbar() {
  const { data, editing } = useApp();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [linkOpen, setLinkOpen] = useState(false);
  const [active, setActive] = useState({ bold: false, italic: false, underline: false });
  const rangeRef = useRef(null);
  const tbRef = useRef(null);
  const linkPanelRef = useRef(null);
  const hideTimer = useRef(null);
  const urlInputRef = useRef(null);

  const saveRange = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) rangeRef.current = sel.getRangeAt(0).cloneRange();
  }, []);

  const restoreRange = useCallback(() => {
    if (!rangeRef.current) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rangeRef.current);
    return true;
  }, []);

  const syncActiveStates = useCallback(() => {
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  }, []);

  const hideToolbar = useCallback(() => {
    setVisible(false);
    setLinkOpen(false);
    rangeRef.current = null;
  }, []);

  useEffect(() => {
    if (!editing) {
      hideToolbar();
      return;
    }
    function onSelectionChange() {
      const sel = window.getSelection();
      const hasText = sel && !sel.isCollapsed && sel.toString().trim().length > 0;
      if (!hasText) {
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => {
          if (!linkPanelRef.current || !linkPanelRef.current.dataset.open) hideToolbar();
        }, 200);
        return;
      }
      if (!isFmtField(sel.anchorNode)) {
        hideToolbar();
        return;
      }
      clearTimeout(hideTimer.current);
      saveRange();
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const isMobile = window.innerWidth < 760;
      if (!isMobile) {
        const w = 300;
        setPos({
          left: Math.min(Math.max(w / 2 + 8, rect.left + rect.width / 2), window.innerWidth - w / 2 - 8),
          top: Math.max(8, rect.top - 46),
        });
      }
      setVisible(true);
      syncActiveStates();
    }
    function onMouseDown(e) {
      const tb = tbRef.current;
      const lp = linkPanelRef.current;
      if ((tb && tb.contains(e.target)) || (lp && lp.contains(e.target))) return;
      if (isFmtField(e.target) || e.target.closest('[contenteditable]')) return;
      hideToolbar();
    }
    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [editing, hideToolbar, saveRange, syncActiveStates]);

  const fmtCmd = useCallback(
    (e, cmd) => {
      e.preventDefault();
      restoreRange();
      document.execCommand(cmd, false, null);
      syncActiveStates();
    },
    [restoreRange, syncActiveStates]
  );

  const fmtWrap = useCallback(
    (e, tag) => {
      e.preventDefault();
      restoreRange();
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const el = document.createElement(tag);
      try {
        range.surroundContents(el);
      } catch {
        el.appendChild(range.extractContents());
        range.insertNode(el);
      }
    },
    [restoreRange]
  );

  const fmtColor = useCallback(
    (e, color) => {
      e.preventDefault();
      restoreRange();
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (range.collapsed) return;
      const frag = range.extractContents();
      // Strip any color already applied within the selection first — otherwise
      // re-picking a color on already-colored text nests spans instead of
      // replacing the color, which looked like "you have to clear formatting
      // before you can change the color".
      frag.querySelectorAll('*').forEach((el) => {
        if (el.style && el.style.color) el.style.removeProperty('color');
      });
      if (color === 'reset') {
        range.insertNode(frag);
        return;
      }
      const span = document.createElement('span');
      span.style.color = color;
      span.appendChild(frag);
      range.insertNode(span);
    },
    [restoreRange]
  );

  const fmtClearAll = useCallback(
    (e) => {
      e.preventDefault();
      restoreRange();
      document.execCommand('removeFormat', false, null);
      hideToolbar();
    },
    [restoreRange, hideToolbar]
  );

  const openLinkPanel = useCallback(
    (e) => {
      e.preventDefault();
      saveRange();
      setLinkOpen((v) => !v);
      setTimeout(() => urlInputRef.current && urlInputRef.current.focus(), 30);
    },
    [saveRange]
  );

  const applyExternalLink = useCallback(() => {
    const url = (urlInputRef.current && urlInputRef.current.value.trim()) || '';
    if (!url || !restoreRange()) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'proc-link';
    a.textContent = sel.toString() || url;
    range.deleteContents();
    range.insertNode(a);
    range.setStartAfter(a);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    hideToolbar();
  }, [restoreRange, hideToolbar]);

  const applyRecipeLink = useCallback(
    (id, title) => {
      if (!restoreRange()) return;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const a = document.createElement('a');
      a.href = '#' + id;
      a.className = 'proc-link';
      a.textContent = sel.toString() || title;
      range.deleteContents();
      range.insertNode(a);
      range.setStartAfter(a);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      hideToolbar();
    },
    [restoreRange, hideToolbar]
  );

  const removeLink = useCallback(
    (e) => {
      e.preventDefault();
      if (!restoreRange()) return;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      let node = sel.getRangeAt(0).commonAncestorContainer;
      if (node.nodeType === 3) node = node.parentElement;
      const a = node.closest('a');
      if (a) a.replaceWith(document.createTextNode(a.textContent));
      hideToolbar();
    },
    [restoreRange, hideToolbar]
  );

  if (!editing) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 760;
  const style = isMobile ? {} : { left: pos.left, top: pos.top };

  return (
    <>
      <div
        id="fmt-toolbar"
        ref={tbRef}
        className={visible ? 'visible' : ''}
        style={style}
        onMouseDown={(e) => e.preventDefault()}
      >
        <button type="button" className={`fmt-btn ${active.bold ? 'active' : ''}`} title="Grassetto" onMouseDown={(e) => fmtCmd(e, 'bold')}>
          B
        </button>
        <button type="button" className={`fmt-btn ${active.italic ? 'active' : ''}`} title="Corsivo" onMouseDown={(e) => fmtCmd(e, 'italic')}>
          I
        </button>
        <button type="button" className={`fmt-btn ${active.underline ? 'active' : ''}`} title="Sottolineato" onMouseDown={(e) => fmtCmd(e, 'underline')}>
          U
        </button>
        <div className="fmt-sep" />
        <button type="button" className="fmt-btn" title="Apice" onMouseDown={(e) => fmtWrap(e, 'sup')}>
          x²
        </button>
        <button type="button" className="fmt-btn" title="Pedice" onMouseDown={(e) => fmtWrap(e, 'sub')}>
          x₂
        </button>
        <div className="fmt-sep" />
        {COLORS.map((c) => (
          <button
            key={c.c}
            type="button"
            className="fmt-swatch"
            title={c.label}
            style={{ background: c.c }}
            onMouseDown={(e) => fmtColor(e, c.c)}
          />
        ))}
        <div className="fmt-sep" />
        <button type="button" className="fmt-btn" title="Collega" onMouseDown={openLinkPanel}>
          🔗
        </button>
        <button type="button" className="fmt-btn" title="Rimuovi link" onMouseDown={removeLink}>
          🔗✕
        </button>
        <button type="button" className="fmt-btn" title="Pulisci formattazione" onMouseDown={fmtClearAll}>
          ✕
        </button>
      </div>
      <div
        id="fmt-link-panel"
        ref={linkPanelRef}
        data-open={linkOpen ? '1' : undefined}
        className={linkOpen ? 'visible' : ''}
        style={isMobile ? {} : { left: pos.left - 130, top: pos.top + 40 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={urlInputRef}
          className="fmt-url-input"
          placeholder="https://…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyExternalLink();
            }
          }}
        />
        <button type="button" className="btn btn-outline" onMouseDown={(e) => e.preventDefault()} onClick={applyExternalLink}>
          Collega URL
        </button>
        {!!(data && data.recipes && data.recipes.length) && (
          <div className="fmt-link-recipes">
            {data.recipes.map((r, i) => (
              <div
                key={r.id}
                className="fmt-link-option"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyRecipeLink(r.id, r.title);
                }}
              >
                <span className="fmt-link-option-label">p.{i + 1}</span>
                {r.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
