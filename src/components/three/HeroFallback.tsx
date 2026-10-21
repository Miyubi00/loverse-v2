export default function HeroFallback({ label = "Ilustrasi hati dan orbit" }: { label?: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center" role="img" aria-label={label}>
      <div className="absolute h-[64%] w-[64%] rounded-full bg-[radial-gradient(circle,rgba(255,214,178,0.22),rgba(255,214,178,0)_68%)] blur-2xl" />
      <svg
        viewBox="0 0 420 420"
        aria-hidden="true"
        className="relative h-[86%] w-[86%] max-w-[520px] animate-drift"
      >
        <defs>
          <linearGradient id="heart-grad" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#ffe9d5" />
            <stop offset="48%" stopColor="#ffd6b2" />
            <stop offset="100%" stopColor="#d87844" />
          </linearGradient>
          <filter id="heart-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="16" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <ellipse
          cx="210"
          cy="214"
          rx="168"
          ry="72"
          fill="none"
          stroke="#ffd6b2"
          strokeOpacity=".32"
          strokeWidth="1"
          transform="rotate(-18 210 214)"
        />
        <ellipse
          cx="210"
          cy="214"
          rx="192"
          ry="92"
          fill="none"
          stroke="#f3bb8b"
          strokeOpacity=".18"
          strokeWidth="1"
          transform="rotate(20 210 214)"
        />
        <circle cx="374" cy="170" r="4" fill="#ffe3c9" />
        <circle cx="52" cy="250" r="2.5" fill="#f3bb8b" opacity=".7" />
        <path
          d="M210 338c-12-9-128-81-128-162 0-47 35-79 76-79 25 0 43 12 52 31 9-19 27-31 52-31 41 0 76 32 76 79 0 81-116 153-128 162Z"
          fill="url(#heart-grad)"
          filter="url(#heart-soft)"
        />
        <path
          d="M210 322c-9-7-116-74-116-147 0-42 31-71 68-71 22 0 39 11 48 28 9-17 26-28 48-28 37 0 68 29 68 71 0 73-107 140-116 147Z"
          fill="none"
          stroke="#fff4e6"
          strokeOpacity=".4"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
