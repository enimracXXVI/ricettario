import { useEffect, useRef } from 'react';

// Uncontrolled contentEditable: initial HTML is imperatively set only when
// `id` or `editing` changes, never on every keystroke — otherwise React
// re-rendering the innerHTML on each render would fight the caret position.
export function RichTextEditor({ id, value, onChange, editing, className = '', placeholder }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!editing) return;
    const el = ref.current;
    if (!el) return;
    el.innerHTML = value || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editing]);

  if (!editing) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: value || '' }} />;
  }

  return (
    <div
      ref={ref}
      className={`rte ${className}`}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      onBlur={() => onChange(ref.current.innerHTML)}
    />
  );
}
