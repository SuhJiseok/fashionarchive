export default function Backdrop({
  isOpen,
  onClose,
  blur = false,
  ariaLabel = 'Close',
}) {
  return (
    <button
      className={`backdrop ${isOpen ? 'is-open' : ''} ${blur ? 'backdrop--blur' : ''}`}
      type="button"
      aria-label={ariaLabel}
      aria-hidden={!isOpen}
      tabIndex={isOpen ? 0 : -1}
      onClick={onClose}
    />
  );
}
