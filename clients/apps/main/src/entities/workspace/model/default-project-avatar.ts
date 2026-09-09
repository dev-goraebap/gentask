const backgrounds = ['#96a27b', '#f5dfa1', '#fac2a7', '#a8bbc5', '#b4c49f', '#c7bbd2'];
const symbols = [
  `<path d="M24 46V38Q24 30 33 30H51L61 41H95Q104 41 104 50V88Q104 98 94 98H34Q24 98 24 88Z"/><path d="M25 53H103" fill="none"/><path d="M41 74H65" fill="none"/>`,
  `<path d="M26 38H74L91 55V94Q91 102 83 102H34Q26 102 26 94Z"/><path d="M39 27H83L102 46V82Q102 90 94 90H47Q39 90 39 82Z"/><path d="M82 28V39Q82 47 91 47H101M53 61H86M53 74H75" fill="none"/>`,
  `<rect x="25" y="28" width="33" height="33" rx="9"/><rect x="70" y="28" width="33" height="33" rx="9"/><rect x="25" y="73" width="33" height="33" rx="9"/><rect x="70" y="73" width="33" height="33" rx="9"/>`,
];

export function defaultProjectAvatarSource(projectId: string): string {
  let hash = 2166136261;
  for (const char of projectId) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const symbol = hash % symbols.length;
  const background = backgrounds[Math.floor(hash / symbols.length) % backgrounds.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="${background}"/><g fill="#fff4df" stroke="#193b30" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">${symbols[symbol]}</g></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
