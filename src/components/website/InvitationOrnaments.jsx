/**
 * Decorative SVG ornaments for Indian wedding invitation themes.
 * All SVG paths are original/reimplemented geometric constructions.
 * Fonts: Google Fonts OFL. Pattern technique: Hero Patterns (MIT).
 */

// Corner flourish ornament — use CSS transforms for other corners
export function CornerOrnament({ color = '#d4a848', size = 100, className = '', style = {} }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`gold-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path d="M5,5 Q5,60 60,60 Q5,60 5,115" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M10,10 Q10,55 55,55" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      <circle cx="60" cy="60" r="3.5" fill={color} opacity="0.4" />
      <path d="M20,8 C25,8 30,12 30,20 C30,28 24,32 20,30 C16,28 14,22 18,18" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <path d="M8,20 C8,25 12,30 20,30 C28,30 32,24 30,20 C28,16 22,14 18,18" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <circle cx="5" cy="5" r="2" fill={color} opacity="0.6" />
      <circle cx="5" cy="115" r="2" fill={color} opacity="0.6" />
    </svg>
  );
}

// All four corners positioned absolutely
export function FourCorners({ color = '#d4a848', size = 80 }) {
  return (
    <>
      <CornerOrnament color={color} size={size} style={{ position: 'absolute', top: 0, left: 0 }} />
      <CornerOrnament color={color} size={size} style={{ position: 'absolute', top: 0, right: 0, transform: 'scaleX(-1)' }} />
      <CornerOrnament color={color} size={size} style={{ position: 'absolute', bottom: 0, left: 0, transform: 'scaleY(-1)' }} />
      <CornerOrnament color={color} size={size} style={{ position: 'absolute', bottom: 0, right: 0, transform: 'scale(-1,-1)' }} />
    </>
  );
}

// Rotating mandala background — subtle, decorative
export function MandalaBackground({ color = '#d4a848', size = 200, opacity = 0.06, className = '' }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'spin 60s linear infinite' }}
    >
      <g fill="none" stroke={color} strokeWidth="0.5" opacity={opacity / 0.06}>
        <circle cx="100" cy="100" r="80" />
        <circle cx="100" cy="100" r="60" />
        <circle cx="100" cy="100" r="40" />
        <circle cx="100" cy="100" r="20" />
        <line x1="100" y1="20" x2="100" y2="180" />
        <line x1="20" y1="100" x2="180" y2="100" />
        <line x1="43" y1="43" x2="157" y2="157" />
        <line x1="157" y1="43" x2="43" y2="157" />
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse
            key={i}
            cx="100"
            cy="50"
            rx="10"
            ry="22"
            transform={`rotate(${i * 45} 100 100)`}
          />
        ))}
      </g>
    </svg>
  );
}

// Horizontal henna/mehndi-style wavy divider
export function HennaDivider({ color = '#d4a848', width = '100%', className = '' }) {
  return (
    <svg
      viewBox="0 0 800 40"
      width={width}
      height="20"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="henna-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="20%" stopColor={color} stopOpacity="0.5" />
          <stop offset="50%" stopColor={color} stopOpacity="0.8" />
          <stop offset="80%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,20 Q50,5 100,20 Q150,35 200,20 Q250,5 300,20 Q350,35 400,20 Q450,5 500,20 Q550,35 600,20 Q650,5 700,20 Q750,35 800,20"
        fill="none"
        stroke="url(#henna-grad)"
        strokeWidth="1.5"
      />
      {[100, 200, 300, 400, 500, 600, 700].map((cx) => (
        <circle key={cx} cx={cx} cy="20" r={cx === 400 ? 3 : 2} fill={color} opacity={cx === 400 ? 0.6 : 0.3} />
      ))}
    </svg>
  );
}

// Triple gold border frame — CSS pseudo-element approach as a component
export function OrnateFrame({ color = '#d4a848', children, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      {/* Outer border */}
      <div
        className="absolute rounded-xl pointer-events-none"
        style={{ inset: 4, border: `2px solid ${color}`, opacity: 0.6 }}
      />
      {/* Inner border */}
      <div
        className="absolute rounded-lg pointer-events-none"
        style={{ inset: 12, border: `1px solid ${color}`, opacity: 0.3 }}
      />
      {/* Innermost dashed border */}
      <div
        className="absolute rounded-md pointer-events-none"
        style={{ inset: 18, border: `0.5px dashed ${color}`, opacity: 0.2 }}
      />
      {children}
    </div>
  );
}

// Mandala-inspired CSS background pattern (no images needed)
export function mandalaPatternCSS(color = '#d4a848', opacity = 0.04) {
  const hex = color.replace('#', '%23');
  return {
    backgroundImage: `radial-gradient(circle at 50% 50%, transparent 18%, rgba(${hexToRgb(color)},${opacity}) 19%, rgba(${hexToRgb(color)},${opacity}) 28%, transparent 29%), radial-gradient(circle at 50% 50%, transparent 38%, rgba(${hexToRgb(color)},${opacity * 0.7}) 39%, rgba(${hexToRgb(color)},${opacity * 0.7}) 48%, transparent 49%)`,
    backgroundSize: '80px 80px',
  };
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
