type Pair = readonly [string, string];
type Palette = {
  id: string; label: string; description: string;
  body: Pair; surface: Pair; card: Pair; muted: Pair;
  accent: Pair; tint: Pair; text: Pair; secondary: Pair; border: Pair; inputBorder: Pair;
};

export const palettes: Palette[] = [
  { id: 'paper', label: '페이퍼 & 잉크', description: '종이빛 바탕과 잉크색 강조. 문서에 집중하는 차분한 조합.',
    body: ['#eeede9', '#191a1b'], surface: ['#faf9f6', '#222426'], card: ['#ffffff', '#2b2d30'], muted: ['#e9e8e3', '#2d3033'],
    accent: ['#39444e', '#bdc9d4'], tint: ['#e4e9ed', '#313d48'], text: ['#24282c', '#eceeed'], secondary: ['#61666b', '#adb3b8'], border: ['#dcdedb', '#3b3f43'], inputBorder: ['#cdd1cf', '#4b5156'] },
  { id: 'sage', label: '세이지 & 크림', description: '은은한 녹색과 따뜻한 크림색. 부드럽고 편안한 조합.',
    body: ['#e9ece5', '#1b1d1b'], surface: ['#fafaf4', '#232623'], card: ['#fffffb', '#292c29'], muted: ['#edf0e6', '#2d312d'],
    accent: ['#4e6748', '#b5c99c'], tint: ['#e3ead9', '#303a2d'], text: ['#293127', '#e8ebe5'], secondary: ['#606c5b', '#adb3a9'], border: ['#d8dfd0', '#393f38'], inputBorder: ['#c8d0c0', '#4b5248'] },
  { id: 'slate', label: '슬레이트 & 블루', description: '푸른 회색과 선명한 파랑. 작업 도구다운 또렷한 조합.',
    body: ['#e9edf3', '#171c25'], surface: ['#f9fbff', '#212936'], card: ['#ffffff', '#2a3443'], muted: ['#eaf0f9', '#2d394c'],
    accent: ['#385ca8', '#a9c5ff'], tint: ['#e1eaff', '#304365'], text: ['#232e40', '#edf2fa'], secondary: ['#5c6a80', '#acbad0'], border: ['#d4deed', '#3b4960'], inputBorder: ['#c4cfdf', '#4b5a70'] },
  { id: 'clay', label: '샌드 & 클레이', description: '모래빛 바탕과 적갈색 강조. 따뜻하면서 개성이 있는 조합.',
    body: ['#efe8e1', '#211b19'], surface: ['#fcf9f5', '#2d2420'], card: ['#fffdfa', '#382d27'], muted: ['#f1e8df', '#40322b'],
    accent: ['#965239', '#e6b099'], tint: ['#f3e2d8', '#50382d'], text: ['#352b25', '#f4ebe3'], secondary: ['#79695e', '#c5b2a4'], border: ['#e3d6ca', '#534139'], inputBorder: ['#d5c6b8', '#655248'] },
];

export function paletteTokens(palette: Palette): Record<string, Pair> {
  return {
    '--color-background-body': palette.body,
    '--color-background-surface': palette.surface,
    '--color-background-card': palette.card,
    '--color-background-popover': palette.card,
    '--color-background-muted': palette.muted,
    '--color-accent': palette.accent,
    '--color-text-accent': palette.accent,
    '--color-icon-accent': palette.accent,
    '--color-accent-muted': palette.tint,
    '--color-on-accent': ['#ffffff', palette.body[1]],
    '--color-text-primary': palette.text,
    '--color-icon-primary': palette.text,
    '--color-text-secondary': palette.secondary,
    '--color-icon-secondary': palette.secondary,
    '--color-border': palette.border,
    '--color-border-emphasized': palette.inputBorder,
  };
}
