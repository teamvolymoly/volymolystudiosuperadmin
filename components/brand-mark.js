export default function BrandMark({ compact = false }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <span aria-hidden="true" className="brand-mark">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-copy">
        <strong>Volymoly</strong>
        {!compact ? <small>Platform control</small> : null}
      </span>
    </div>
  );
}
