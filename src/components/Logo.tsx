export function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size, borderRadius: size * 0.34 }} aria-hidden>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M12 2.6l2.4 6.1 6.5 1.1-4.6 4.7 1 6.5-5.3-3.4-5.3 3.4 1-6.5L2.6 9.8l6.5-1.1L12 2.6z" fill="currentColor" opacity="0.92" />
        <circle cx="12" cy="12" r="2.1" fill="var(--site-accent)" />
      </svg>
    </span>
  );
}

export function Brand({ sub, onClick }: { sub?: string; onClick?: () => void }) {
  const content = (
    <>
      <LogoMark />
      <div>
        <div className="brand-name">Atlas</div>
        {sub ? <div className="brand-sub">{sub}</div> : null}
      </div>
    </>
  );
  if (onClick) {
    return (
      <button type="button" className="brand" onClick={onClick} style={{ background: "none", border: 0, padding: "6px 10px 22px" }}>
        {content}
      </button>
    );
  }
  return <div className="brand">{content}</div>;
}
