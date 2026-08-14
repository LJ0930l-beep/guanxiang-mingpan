# 观象·命盘 — Design system

## Product thesis

观象不是“给一句命运结论”的算命工具，而是一座可以反复进入、保存和核验命盘的私人观象台。目标用户是对八字、六爻、紫微斗数与西方星盘好奇的年轻中文用户。

## Signature

The signature element is the **观象仪**: a set of restrained concentric celestial rings, calibrated with 子午卯酉 and four divination domains. It may rotate slowly only where it carries meaning. Other decoration stays quiet.

## Color tokens

| Token | Value | Use |
|---|---:|---|
| Obsidian | `#050907` | App background |
| Deep jade | `#081A16` | Elevated surfaces |
| Jade mist | `#143129` | Selected and secondary surfaces |
| Aged brass | `#C6A66B` | Primary actions and key marks |
| Pale brass | `#E2C88E` | Highlight text |
| Rice paper | `#E9E0CA` | Primary text |
| Ash green | `#98A79F` | Secondary text |
| Patina | `#5D8F80` | Informational state |
| Cinnabar | `#9F5143` | Destructive/error state only |
| Hairline | `rgba(198,166,107,0.22)` | Dividers and ring outlines |

Do not use pure black, neon purple, generic blue gradients, or large frosted-glass cards. Depth comes from jade tone shifts, hairlines and light falloff.

## Typography

- Display: `Songti SC` / `STSong` / platform serif. Use only for brand, page titles and the center of the observatory dial.
- Body: `PingFang SC` / `Microsoft YaHei` / platform sans-serif.
- Data: `DIN Alternate` / `SF Pro Rounded` / platform sans-serif. Use tabular numerals when supported.
- Minimum body size: 15 on native, 16 on web. Captions never below 12.

## Shape and spacing

- Radius: 8 for inputs, 14 for cards, 999 only for chips.
- Main spacing scale: 4, 8, 12, 16, 24, 32, 48, 72.
- Touch targets: minimum 44 × 44.
- Web content width: 1120 maximum. Mobile gutters: 20.

## Motion

- One ambient motion per screen at most.
- Observatory dial: 36–48 second linear rotation.
- Press feedback: 0.98 scale or opacity, 120–180 ms.
- Screen content: 240–360 ms ease-out.
- Respect reduced-motion preferences and keep all actions usable without animation.

## Voice

Calm, specific and non-deterministic. Explain what is known, what is inferred, and what is unavailable. Never use fear, guaranteed outcomes, or fabricated precision.

Examples:

- Good: “缺少出生时辰，宫位与上升星座暂不可确定。”
- Avoid: “你的命运已经注定。”
- Good: “先建立一位命主，再开始排盘。”
- Avoid: “提交资料。”

## Accessibility and interaction

- Text contrast targets WCAG AA.
- Every pressable has an accessibility role and label.
- Inputs retain visible labels; placeholders are examples only.
- Errors appear next to the relevant field.
- Keyboard focus is visible on web.
- Content works at 375, 768, 1024 and 1440 widths without horizontal scrolling.

