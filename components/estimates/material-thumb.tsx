/** Thumbnail for a material list: a parcel/box, set on the same navy tile as the plans. */
export function MaterialThumb() {
  return (
    <div className="plan-thumb material-thumb-art">
      <svg viewBox="0 0 160 110" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M58 46h44v38H58z" />
          <path d="M58 46l9-9h44l-9 9" />
          <path d="M74 58h12" />
          <path d="M74 68h20" />
        </g>
        <circle cx="116" cy="34" r="5" fill="#f5b301" />
      </svg>
    </div>
  );
}
