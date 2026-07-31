import { useEffect } from 'react';

// Freezes background scroll while an overlay (modal/drawer/popover) is open —
// without this, the page underneath stays scrollable, which both looks sloppy
// and (for anything position:fixed and anchored to a specific element, like
// the glossary popover) lets the anchor scroll away from the fixed overlay.
let lockCount = 0;

export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    lockCount += 1;
    if (lockCount === 1) document.body.style.overflow = 'hidden';
    return () => {
      lockCount -= 1;
      if (lockCount === 0) document.body.style.overflow = '';
    };
  }, [active]);
}
