export function Logo({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Code Review Analyzer">
      <rect width="48" height="48" rx="13" fill="url(#logo-gradient)" />
      <path
        d="m19 15-8 9 8 9M29 15l8 9-8 9"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m27 11-6 26" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity=".72" />
      <defs>
        <linearGradient id="logo-gradient" x1="6" y1="4" x2="42" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#776BFF" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
      </defs>
    </svg>
  );
}
