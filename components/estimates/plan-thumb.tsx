/** Floor-plan thumbnail used on project and estimate cards. */
export function PlanThumb({ variant = 0 }: { variant?: number }) {
  const plans = [
    {
      walls: "M26 16h108v78H26z M80 16v78 M26 55h108",
      dots: [[52, 36], [108, 36], [52, 74], [108, 74]] as [number, number][],
    },
    {
      walls: "M26 16h108v78H26z M26 48h62 M88 16v78 M26 72h108",
      dots: [[44, 32], [70, 60], [114, 40], [114, 74]] as [number, number][],
    },
    {
      walls: "M26 16h108v78H26z M62 16v78 M26 55h108",
      dots: [[42, 34], [96, 34], [96, 74]] as [number, number][],
    },
  ];
  const plan = plans[variant % plans.length];

  return (
    <div className="plan-thumb">
      <svg viewBox="0 0 160 110" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <path d={plan.walls} fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="square" />
        {plan.dots.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="#f5b301" />
        ))}
      </svg>
    </div>
  );
}
