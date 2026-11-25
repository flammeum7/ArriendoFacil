import { useId } from 'react';

export default function Modal({ open, title, onClose, children, footer }) {
  const titleId = useId(); // los hooks van antes del return condicional
  if (!open) return null;
  return (
    <div className="af-modal__overlay" onClick={onClose}>
      <div
        className="af-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="af-modal__head">
          <h2 className="af-modal__title" id={titleId}>{title}</h2>
          <button className="af-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="af-modal__body">{children}</div>
        {footer && <div className="af-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}
