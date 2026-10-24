// Recreation of the EquiTrack "e / Track" wordmark.
export default function Logo({ width = 120 }) {
  return (
    <svg viewBox="0 0 300 180" width={width} role="img" aria-label="EquiTrack" style={{ display: 'block' }}>
      <path d="M118 78 L190 24 C150 -4 62 8 52 90 C44 170 140 188 178 140"
        fill="none" stroke="#b5f26e" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" transform="translate(-10 4)" />
      <line x1="150" y1="98" x2="298" y2="98" stroke="#3b5fc0" strokeWidth="3" />
      <text x="156" y="160" fontFamily="Jost, sans-serif" fontWeight="400" fontSize="86" fill="#3b5fc0" letterSpacing="-2">Track</text>
    </svg>
  );
}
