# 마크

앱 아이콘과 파비콘이 되는 그림입니다. 이름을 그리는 글꼴은 [FONTS.md](../FONTS.md) 가 갖습니다.

## 형태

세로로 내려긋는 획과 올라가는 사선이 한 번에 이어집니다. 앞의 세로 획은 입력 커서(Gen), 뒤의 사선은 완료 표시(Task) 입니다.

획 끝을 둥글리지 않고 이음을 각지게 둔 것은 화면 전체가 `--radius: 0` 이기 때문입니다. 색은 `--primary` 와 `--primary-foreground` 를 그대로 씁니다.

왼쪽 아래로 길게 뻗은 꼭짓점은 두 획의 사이각이 45도여서 이음매(miter)가 그만큼 나온 것이며, 의도한 형태입니다. `stroke-linejoin` 을 `bevel` 로 바꾸거나 사이각을 벌리면 이 꼭짓점이 사라집니다.

획 두께는 판의 15.6% 입니다. 16px 파비콘에서 2.5px 로 서며 그보다 얇으면 판 안에서 사라집니다.

## 마스커블을 따로 두는 이유

안드로이드는 설치된 아이콘을 제 모양으로 깎습니다. 안전 구역은 판 지름의 80% 인 원이고 그 밖은 잘립니다. 마스터의 획은 대각선 절반이 42.7 로 안전 반지름 38.4 를 넘으므로, 0.85 로 줄인 판을 따로 둡니다.

## 뽑기

```bash
cd clients && node apps/web/brand/render.mjs
```

e2e 가 이미 갖고 있는 크로미움으로 그리므로 의존을 늘리지 않습니다. 크기의 원본은 [manifest.webmanifest](../public/manifest.webmanifest) 와 [index.html](../src/index.html) 이며, 아래 표는 그것을 따라 적은 것입니다.

| 파일 | 원본 | 크기 |
| :--- | :--- | :--- |
| `icon-192.png` | `mark.svg` | 192 |
| `icon-512.png` | `mark.svg` | 512 |
| `apple-touch-icon.png` | `mark.svg` | 180 |
| `icon-maskable-192.png` | `mark-maskable.svg` | 192 |
| `icon-maskable-512.png` | `mark-maskable.svg` | 512 |
