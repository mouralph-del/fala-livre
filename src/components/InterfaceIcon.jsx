export default function InterfaceIcon({ name, className = '' }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9" /></>,
    book: <><path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1v15" /><path d="M5 7h4M5 10h4M15 7h4M15 10h4" /></>,
    chart: <><path d="M3 21h18M5 21V12h3v9M11 21V7h3v14M17 21V3h3v18" /></>,
    crown: <><path d="m3 6 4 3 5-6 5 6 4-3-3 12H6ZM6 21h12" /></>,
    controller: <><path d="M8 6h8c4 0 5 4 6 10 1 5-3 5-6 1H8c-3 4-7 4-6-1 1-6 2-10 6-10Z" /><path d="M6 9v6M3 12h6M16 10h.01M19 13h.01" /></>,
    checklist: <><rect x="4" y="4" width="16" height="18" rx="2" /><path d="M9 4V2h6v2M7 9l1 1 2-2M13 9h4M7 14l1 1 2-2M13 14h4M7 19l1 1 2-2M13 19h4" /></>,
  }
  return <svg className={`interface-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>
}
