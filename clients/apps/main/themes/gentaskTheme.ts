import {defineTheme} from '@astryxdesign/core/theme';
import {matchaTheme} from '@astryxdesign/theme-matcha';

// hoho-hr/web/src/styles.css의 Halo · Olive 색상을 Matcha의 형태에 적용한다.
export const gentaskTheme = defineTheme({
  name: 'gentask',
  extends: matchaTheme,
  // Astryx 0.5.2의 토스트 명암 판정은 OKLCH를 지원하지 않으므로 관련 배경·전경은 HEX로 둔다.
  tokens: {
  "--color-accent": [
    "oklch(0.5 0.105 118)",
    "oklch(0.68 0.12 118)"
  ],
  "--color-accent-muted": [
    "oklch(0.945 0.008 110)",
    "oklch(0.285 0.014 118)"
  ],
  "--color-text-accent": [
    "oklch(0.5 0.105 118)",
    "oklch(0.68 0.12 118)"
  ],
  "--color-icon-accent": [
    "oklch(0.5 0.105 118)",
    "oklch(0.68 0.12 118)"
  ],
  "--color-on-accent": [
    "oklch(0.99 0.02 118)",
    "oklch(0.18 0.03 118)"
  ],
  "--color-background-body": [
    "oklch(0.97 0.006 110)",
    "oklch(0.175 0.008 118)"
  ],
  "--color-background-surface": [
    "oklch(0.995 0.002 110)",
    "oklch(0.215 0.01 118)"
  ],
  "--color-background-card": [
    "oklch(0.995 0.002 110)",
    "oklch(0.215 0.01 118)"
  ],
  "--color-background-popover": [
    "#ffffff",
    "#22241d"
  ],
  "--color-background-muted": [
    "oklch(0.945 0.008 110)",
    "oklch(0.285 0.014 118)"
  ],
  "--color-background-inverted": [
    "#1d1e16",
    "#f2f2ee"
  ],
  "--color-text-primary": [
    "#1d1e16",
    "#f2f2ee"
  ],
  "--color-text-secondary": [
    "oklch(0.47 0.02 110)",
    "oklch(0.74 0.02 110)"
  ],
  "--color-text-disabled": [
    "oklch(0.63 0.02 110)",
    "oklch(0.58 0.02 110)"
  ],
  "--color-icon-primary": [
    "#1d1e16",
    "#f2f2ee"
  ],
  "--color-icon-secondary": [
    "oklch(0.47 0.02 110)",
    "oklch(0.74 0.02 110)"
  ],
  "--color-icon-disabled": [
    "oklch(0.63 0.02 110)",
    "oklch(0.58 0.02 110)"
  ],
  "--color-border": [
    "oklch(0.915 0.008 110)",
    "oklch(1 0 0 / 0.1)"
  ],
  "--color-border-emphasized": [
    "oklch(0.85 0.012 110)",
    "oklch(1 0 0 / 0.2)"
  ],
  "--color-skeleton": [
    "oklch(0.945 0.008 110)",
    "oklch(0.285 0.014 118)"
  ],
  "--color-neutral": [
    "oklch(0.945 0.008 110)",
    "oklch(0.285 0.014 118)"
  ],
  "--color-overlay": [
    "oklch(0.18 0.01 110 / 0.45)",
    "oklch(0 0 0 / 0.6)"
  ],
  "--color-on-dark": "#f2f2ee",
  "--color-on-light": "#1d1e16",
  "--color-overlay-hover": [
    "oklch(0.23 0.015 110 / 0.04)",
    "oklch(0.96 0.005 110 / 0.06)"
  ],
  "--color-overlay-pressed": [
    "oklch(0.23 0.015 110 / 0.08)",
    "oklch(0.96 0.005 110 / 0.1)"
  ],
  "--color-shadow": [
    "oklch(0.18 0.01 110 / 0.1)",
    "oklch(0 0 0 / 0.4)"
  ],
  "--color-success": [
    "oklch(0.55 0.13 150)",
    "oklch(0.72 0.14 150)"
  ],
  "--color-success-muted": [
    "oklch(0.95 0.04 150)",
    "oklch(0.3 0.05 150)"
  ],
  "--color-on-success": [
    "oklch(0.99 0.003 110)",
    "oklch(0.18 0.008 118)"
  ],
  "--shadow-inset-success": [
    "inset 0 0 0 2px oklch(0.95 0.04 150)",
    "inset 0 0 0 2px oklch(0.3 0.05 150)"
  ],
  "--color-warning": [
    "oklch(0.64 0.13 75)",
    "oklch(0.78 0.13 80)"
  ],
  "--color-warning-muted": [
    "oklch(0.95 0.05 80)",
    "oklch(0.32 0.05 80)"
  ],
  "--color-on-warning": [
    "#1d1e16",
    "oklch(0.18 0.008 118)"
  ],
  "--shadow-inset-warning": [
    "inset 0 0 0 2px oklch(0.95 0.05 80)",
    "inset 0 0 0 2px oklch(0.32 0.05 80)"
  ],
  "--color-error": [
    "oklch(0.56 0.2 25)",
    "oklch(0.7 0.17 25)"
  ],
  "--color-error-muted": [
    "#ffe5e1",
    "#4d2623"
  ],
  "--color-on-error": [
    "oklch(0.99 0.003 110)",
    "oklch(0.18 0.008 118)"
  ],
  "--shadow-inset-error": [
    "inset 0 0 0 2px #ffe5e1",
    "inset 0 0 0 2px #4d2623"
  ],
  "--color-background-blue": [
    "oklch(0.95 0.04 235)",
    "oklch(0.3 0.05 235)"
  ],
  "--color-border-blue": [
    "oklch(0.95 0.04 235)",
    "oklch(0.3 0.05 235)"
  ],
  "--color-icon-blue": [
    "oklch(0.58 0.1 235)",
    "oklch(0.72 0.11 235)"
  ],
  "--color-text-blue": [
    "oklch(0.58 0.1 235)",
    "oklch(0.72 0.11 235)"
  ],
  "--color-background-cyan": [
    "oklch(0.95 0.04 235)",
    "oklch(0.3 0.05 235)"
  ],
  "--color-border-cyan": [
    "oklch(0.95 0.04 235)",
    "oklch(0.3 0.05 235)"
  ],
  "--color-icon-cyan": [
    "oklch(0.58 0.1 235)",
    "oklch(0.72 0.11 235)"
  ],
  "--color-text-cyan": [
    "oklch(0.58 0.1 235)",
    "oklch(0.72 0.11 235)"
  ],
  "--color-background-gray": [
    "oklch(0.945 0.008 110)",
    "oklch(0.285 0.014 118)"
  ],
  "--color-border-gray": [
    "oklch(0.945 0.008 110)",
    "oklch(0.285 0.014 118)"
  ],
  "--color-icon-gray": [
    "oklch(0.47 0.02 110)",
    "oklch(0.74 0.02 110)"
  ],
  "--color-text-gray": [
    "oklch(0.47 0.02 110)",
    "oklch(0.74 0.02 110)"
  ],
  "--color-background-green": [
    "oklch(0.95 0.04 150)",
    "oklch(0.3 0.05 150)"
  ],
  "--color-border-green": [
    "oklch(0.95 0.04 150)",
    "oklch(0.3 0.05 150)"
  ],
  "--color-icon-green": [
    "oklch(0.55 0.13 150)",
    "oklch(0.72 0.14 150)"
  ],
  "--color-text-green": [
    "oklch(0.55 0.13 150)",
    "oklch(0.72 0.14 150)"
  ],
  "--color-background-orange": [
    "oklch(0.95 0.05 80)",
    "oklch(0.32 0.05 80)"
  ],
  "--color-border-orange": [
    "oklch(0.95 0.05 80)",
    "oklch(0.32 0.05 80)"
  ],
  "--color-icon-orange": [
    "oklch(0.64 0.13 75)",
    "oklch(0.78 0.13 80)"
  ],
  "--color-text-orange": [
    "oklch(0.64 0.13 75)",
    "oklch(0.78 0.13 80)"
  ],
  "--color-background-pink": [
    "#ffe5e1",
    "#4d2623"
  ],
  "--color-border-pink": [
    "#ffe5e1",
    "#4d2623"
  ],
  "--color-icon-pink": [
    "oklch(0.56 0.2 25)",
    "oklch(0.7 0.17 25)"
  ],
  "--color-text-pink": [
    "oklch(0.56 0.2 25)",
    "oklch(0.7 0.17 25)"
  ],
  "--color-background-purple": [
    "oklch(0.95 0.04 235)",
    "oklch(0.3 0.05 235)"
  ],
  "--color-border-purple": [
    "oklch(0.95 0.04 235)",
    "oklch(0.3 0.05 235)"
  ],
  "--color-icon-purple": [
    "oklch(0.58 0.1 235)",
    "oklch(0.72 0.11 235)"
  ],
  "--color-text-purple": [
    "oklch(0.58 0.1 235)",
    "oklch(0.72 0.11 235)"
  ],
  "--color-background-red": [
    "#ffe5e1",
    "#4d2623"
  ],
  "--color-border-red": [
    "#ffe5e1",
    "#4d2623"
  ],
  "--color-icon-red": [
    "oklch(0.56 0.2 25)",
    "oklch(0.7 0.17 25)"
  ],
  "--color-text-red": [
    "oklch(0.56 0.2 25)",
    "oklch(0.7 0.17 25)"
  ],
  "--color-background-teal": [
    "oklch(0.95 0.04 150)",
    "oklch(0.3 0.05 150)"
  ],
  "--color-border-teal": [
    "oklch(0.95 0.04 150)",
    "oklch(0.3 0.05 150)"
  ],
  "--color-icon-teal": [
    "oklch(0.55 0.13 150)",
    "oklch(0.72 0.14 150)"
  ],
  "--color-text-teal": [
    "oklch(0.55 0.13 150)",
    "oklch(0.72 0.14 150)"
  ],
  "--color-background-yellow": [
    "oklch(0.95 0.05 80)",
    "oklch(0.32 0.05 80)"
  ],
  "--color-border-yellow": [
    "oklch(0.95 0.05 80)",
    "oklch(0.32 0.05 80)"
  ],
  "--color-icon-yellow": [
    "oklch(0.64 0.13 75)",
    "oklch(0.78 0.13 80)"
  ],
  "--color-text-yellow": [
    "oklch(0.64 0.13 75)",
    "oklch(0.78 0.13 80)"
  ]
},
  onLight: {tokens: {"--color-accent": "oklch(0.5 0.105 118)", "--color-text-primary": "#1d1e16", "--color-icon-primary": "#1d1e16"}},
  onDark: {tokens: {"--color-accent": "oklch(0.68 0.12 118)", "--color-text-primary": "#f2f2ee", "--color-icon-primary": "#f2f2ee"}},
  components: {
  "popover-surface": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    }
  },
  "dialog": {
    "variant:standard": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    }
  },
  "bottom-sheet": {
    "base": {
      "borderStartStartRadius": "1.5rem",
      "borderStartEndRadius": "1.5rem",
      "cornerStartStartShape": "superellipse(1.6)",
      "cornerStartEndShape": "superellipse(1.6)"
    }
  },
  "toast": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)",
      "backgroundColor": "var(--color-background-popover)",
      "color": "var(--color-text-primary)",
      "borderWidth": "var(--border-width)",
      "borderStyle": "solid",
      "borderColor": "var(--color-border-emphasized)"
    },
    "type:error": {
      "backgroundColor": "var(--color-error-muted)",
      "borderColor": "var(--color-error)"
    }
  },

  "side-nav-item": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    }
  },
  "app-shell-sidenav": {
    "base": {"backgroundColor": "var(--color-background-body)"}
  },
  "top-nav-heading": {
    "base": {
      "color": "light-dark(oklch(0.5 0.105 118), oklch(0.68 0.12 118))",
      "--color-text-primary": "light-dark(oklch(0.5 0.105 118), oklch(0.68 0.12 118))"
    }
  },
  "top-nav-item": {
    "base": {
      "color": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "selected": {
      "color": "light-dark(oklch(0.5 0.105 118), oklch(0.68 0.12 118))"
    }
  },
  "button": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    },
    "variant:secondary": {
      "borderColor": "light-dark(oklch(0.5 0.105 118), oklch(0.68 0.12 118))",
      "color": "light-dark(oklch(0.5 0.105 118), oklch(0.68 0.12 118))",
      ":hover": {
        "backgroundColor": "light-dark(oklch(0.95 0.04 118), oklch(0.3 0.05 118))"
      }
    },
    "variant:ghost": {
      "color": "var(--color-text-secondary)",
      ":hover": {
        "color": "var(--color-text-primary)"
      },
      ":focus-visible": {
        "color": "var(--color-text-primary)"
      }
    },
    "variant:destructive": {
      "backgroundColor": "light-dark(#ffe5e1, #4d2623)",
      "color": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "badge": {
    "variant:info": {
      "backgroundColor": "light-dark(oklch(0.95 0.04 235), oklch(0.3 0.05 235))",
      "color": "light-dark(oklch(0.58 0.1 235), oklch(0.72 0.11 235))"
    },
    "variant:neutral": {
      "backgroundColor": "light-dark(oklch(0.95 0.04 118), oklch(0.3 0.05 118))",
      "color": "light-dark(oklch(0.5 0.105 118), oklch(0.68 0.12 118))"
    },
    "variant:success": {
      "backgroundColor": "light-dark(oklch(0.95 0.04 150), oklch(0.3 0.05 150))",
      "color": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "variant:warning": {
      "backgroundColor": "light-dark(oklch(0.95 0.05 80), oklch(0.32 0.05 80))",
      "color": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "variant:error": {
      "backgroundColor": "light-dark(#ffe5e1, #4d2623)",
      "color": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "banner": {
    "status:info": {
      "--color-accent-muted": "light-dark(oklch(0.95 0.04 235), oklch(0.3 0.05 235))",
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))",
      "--color-accent": "light-dark(oklch(0.58 0.1 235), oklch(0.72 0.11 235))"
    },
    "status:success": {
      "--color-success-muted": "light-dark(oklch(0.95 0.04 150), oklch(0.3 0.05 150))",
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))",
      "--color-success": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "status:warning": {
      "--color-warning-muted": "light-dark(oklch(0.95 0.05 80), oklch(0.32 0.05 80))",
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))",
      "--color-warning": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "status:error": {
      "--color-error-muted": "light-dark(#ffe5e1, #4d2623)",
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))",
      "--color-error": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "card": {
    "variant:info": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:success": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:warning": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:error": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:blue": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:cyan": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:gray": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:green": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:orange": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:pink": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:purple": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:red": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:teal": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:yellow": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    },
    "variant:muted": {
      "--color-text-primary": "light-dark(#1d1e16, #f2f2ee)",
      "--color-text-secondary": "light-dark(oklch(0.47 0.02 110), oklch(0.74 0.02 110))"
    }
  },
  "progressbar-track": {
    "base": {
      "backgroundColor": "light-dark(oklch(0.945 0.008 110), oklch(0.285 0.014 118))"
    }
  },
  "progressbar-fill": {
    "variant:success": {
      "backgroundColor": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "variant:warning": {
      "backgroundColor": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "variant:error": {
      "backgroundColor": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "field-status": {
    "type:success": {
      "backgroundColor": "light-dark(oklch(0.95 0.04 150), oklch(0.3 0.05 150))",
      "color": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "type:warning": {
      "backgroundColor": "light-dark(oklch(0.95 0.05 80), oklch(0.32 0.05 80))",
      "color": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "type:error": {
      "backgroundColor": "light-dark(#ffe5e1, #4d2623)",
      "color": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "text-input": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    },
    "status:success": {
      "--color-success": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "status:warning": {
      "--color-warning": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "status:error": {
      "--color-error": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "textarea": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    },
    "status:success": {
      "--color-success": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "status:warning": {
      "--color-warning": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "status:error": {
      "--color-error": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "number-input": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    },
    "status:success": {
      "--color-success": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "status:warning": {
      "--color-warning": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "status:error": {
      "--color-error": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "date-input": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    },
    "status:success": {
      "--color-success": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "status:warning": {
      "--color-warning": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "status:error": {
      "--color-error": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "time-input": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    },
    "status:success": {
      "--color-success": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "status:warning": {
      "--color-warning": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "status:error": {
      "--color-error": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "selector": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    },
    "status:success": {
      "--color-success": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "status:warning": {
      "--color-warning": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "status:error": {
      "--color-error": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "multi-selector": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    },
    "status:success": {
      "--color-success": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "status:warning": {
      "--color-warning": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "status:error": {
      "--color-error": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "typeahead": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    },
    "status:success": {
      "--color-success": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "status:warning": {
      "--color-warning": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "status:error": {
      "--color-error": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  },
  "tokenizer": {
    "base": {
      "borderRadius": "1.5rem",
      "cornerShape": "superellipse(1.6)"
    },
    "status:success": {
      "--color-success": "light-dark(oklch(0.55 0.13 150), oklch(0.72 0.14 150))"
    },
    "status:warning": {
      "--color-warning": "light-dark(oklch(0.64 0.13 75), oklch(0.78 0.13 80))"
    },
    "status:error": {
      "--color-error": "light-dark(oklch(0.56 0.2 25), oklch(0.7 0.17 25))"
    }
  }
}
});
