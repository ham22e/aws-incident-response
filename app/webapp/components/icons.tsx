// 인라인 SVG 아이콘(외부 폰트/라이브러리 없음). stroke=currentColor 로 색은
// 상위 요소가 결정하고, 크기는 CSS(.nav-item svg 등)가 조정한다.
const P = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function Icon({ name }: { name: string }) {
  switch (name) {
    case 'overview':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case 'server':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <rect x="3" y="4" width="18" height="7" rx="1.5" />
          <rect x="3" y="13" width="18" height="7" rx="1.5" />
          <path d="M7 7.5h.01M7 16.5h.01" />
        </svg>
      );
    case 'wrench':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.3-2.3 2.6-2.6z" />
        </svg>
      );
    case 'network':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <circle cx="12" cy="12" r="2.2" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V4zM8.5 10h7M8.5 14h7M8.5 18h4" />
        </svg>
      );
    case 'settings':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2l-.4-2.5H10.8l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.5h4.4l.4-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5A7 7 0 0 0 19 12z" />
        </svg>
      );
    case 'bell':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      );
    case 'search':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case 'user':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case 'logout':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
        </svg>
      );
    case 'database':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
        </svg>
      );
    case 'storage':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <path d="M3 8l9-5 9 5-9 5-9-5z" />
          <path d="M3 8v8l9 5 9-5V8M12 13v8" />
        </svg>
      );
    case 'shield':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'activity':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <path d="M3 12h4l3 8 4-16 3 8h4" />
        </svg>
      );
    case 'chevron':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" {...P}>
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}
