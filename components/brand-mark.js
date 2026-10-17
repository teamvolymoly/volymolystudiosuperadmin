export default function BrandMark({ compact = false, inverse = false }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""} ${inverse ? "brand-inverse" : ""}`.trim()}>
      <span aria-hidden="true" className="brand-mark">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-copy">
        <strong>Volymoly</strong>
        {!compact ? <small>Super Admin</small> : null}
      </span>
    </div>
  );
}
