// Decorative SVG art for the prayer dashboard (pure presentation, no logic).
// All colours come from currentColor so the art follows the light/dark theme.

/** Eight-point-star lattice used in the card corners. */
export function ArabesqueCorner({ className = "" }: { className?: string }) {
  const id = "arabesque-star";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <defs>
        <g id={id}>
          <path d="M0-14 4-4 14 0 4 4 0 14-4 4-14 0-4-4Z" />
          <circle r="3" />
        </g>
      </defs>
      <path d="M0 0H120A120 120 0 0 1 0 120Z" fill="currentColor" fillOpacity="0.05" stroke="none" />
      {[
        [18, 18], [54, 18], [90, 18],
        [18, 54], [54, 54],
        [18, 90],
      ].map(([x, y]) => (
        <use key={`${x}-${y}`} href={`#${id}`} x={x} y={y} />
      ))}
      <path d="M36 36 72 36M36 36 36 72" strokeOpacity="0.5" />
    </svg>
  );
}

/** Small leafy sprig for the corners of the info bar. */
export function LeafSprig({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 90" className={className} fill="currentColor">
      <path d="M2 88C30 70 52 46 70 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {[
        [14, 78, -35, 1], [26, 66, 30, 1], [32, 56, -40, 1], [44, 44, 25, 1],
        [50, 34, -45, 0.9], [60, 22, 20, 0.9], [66, 10, -30, 0.8],
      ].map(([x, y, r, s], i) => (
        <path
          key={i}
          d="M0 0C10-14 26-12 30 0 20 12 6 12 0 0Z"
          transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
          fillOpacity={0.55 + (i % 3) * 0.15}
        />
      ))}
    </svg>
  );
}

/** Soft mosque skyline: domes + minarets, faded at the edges via mask. */
export function MosqueIllustration({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 640 300" className={className} preserveAspectRatio="xMidYMax slice" fill="currentColor">
      <defs>
        <linearGradient id="mosque-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.15" />
        </linearGradient>
        <mask id="mosque-mask">
          <rect width="640" height="300" fill="url(#mosque-fade)" />
        </mask>
      </defs>
      <g mask="url(#mosque-mask)">
        {/* hills / trees */}
        <path d="M0 300V232C60 210 110 238 170 222 240 204 300 236 370 224 450 210 520 236 640 214V300Z" fillOpacity="0.16" />
        {/* main hall */}
        <rect x="170" y="196" width="300" height="104" fillOpacity="0.22" />
        {/* arches */}
        {[196, 238, 280, 322, 364, 406].map((x) => (
          <path key={x} d={`M${x} 262V240a16 16 0 0 1 32 0V262Z`} fill="#fff" fillOpacity="0.45" />
        ))}
        {/* central dome */}
        <path d="M232 196a88 88 0 0 1 176 0Z" fillOpacity="0.3" />
        <rect x="318" y="86" width="4" height="22" fillOpacity="0.4" />
        <circle cx="320" cy="82" r="5" fillOpacity="0.4" />
        {/* side domes */}
        <path d="M176 200a40 40 0 0 1 80 0Z" fillOpacity="0.26" />
        <path d="M384 200a40 40 0 0 1 80 0Z" fillOpacity="0.26" />
        {/* minarets */}
        {[148, 492].map((x) => (
          <g key={x}>
            <rect x={x - 9} y="90" width="18" height="210" fillOpacity="0.24" />
            <rect x={x - 14} y="130" width="28" height="7" fillOpacity="0.3" />
            <path d={`M${x - 11} 90a11 11 0 0 1 22 0Z`} fillOpacity="0.3" />
            <rect x={x - 1.5} y="64" width="3" height="26" fillOpacity="0.35" />
          </g>
        ))}
        {[78, 562].map((x) => (
          <g key={x}>
            <rect x={x - 7} y="150" width="14" height="150" fillOpacity="0.18" />
            <path d={`M${x - 9} 150a9 9 0 0 1 18 0Z`} fillOpacity="0.24" />
          </g>
        ))}
      </g>
    </svg>
  );
}
