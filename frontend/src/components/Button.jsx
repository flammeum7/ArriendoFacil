export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled,
  onClick,
  full,
  ...rest
}) {
  const cls = ['af-btn', `af-btn--${variant}`, full ? 'af-btn--full' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
