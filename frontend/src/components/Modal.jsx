export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="af-modal__overlay" onClick={onClose}>
      <div className="af-modal" onClick={(e) => e.stopPropagation()}>
        <div className="af-modal__head">
          <h2 className="af-modal__title">{title}</h2>
          <button className="af-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="af-modal__body">{children}</div>
        {footer && <div className="af-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}
