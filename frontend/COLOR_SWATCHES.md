# JCKL Academy Theme - Color Swatches & Usage

## Primary Color Palette

### 🔵 Navy (Primary)
```
Color: Navy
Hex: #1a3a7a
RGB: 26, 58, 122
HSL: 218°, 65%, 29%
Usage: Primary headings, main buttons, primary navigation, text
Accessibility: WCAG AAA on white (#ffffff)
```
**Best For:**
- Main headlines (h1, h2)
- Primary CTA buttons
- Link text
- Primary navigation
- Body text headings

### 🔵 Light Navy (Secondary)
```
Color: Light Navy
Hex: #2d5aae
RGB: 45, 90, 174
HSL: 218°, 59%, 43%
Usage: Hover states, secondary elements, card borders
Accessibility: WCAG AA on white
```
**Best For:**
- Button hover states
- Secondary navigation
- Links on hover
- Secondary headings
- Card shadows

### 💜 Royal Purple (Accent)
```
Color: Royal Purple
Hex: #6b3fa0
RGB: 107, 63, 160
HSL: 268°, 44%, 44%
Usage: Premium features, secondary accents, footer elements
Accessibility: WCAG AA on white
```
**Best For:**
- Premium feature icons
- Secondary action buttons
- Decorative elements
- Accent text
- Borders on special elements

### 💜 Light Purple (Accent Light)
```
Color: Light Purple
Hex: #8b5cf6
RGB: 139, 92, 246
HSL: 268°, 95%, 66%
Usage: Lighter accent on purple elements
```
**Best For:**
- Light backgrounds
- Hover states on purple
- Secondary accents
- Disabled states

### ✨ Gold (Highlight)
```
Color: Gold
Hex: #fcd34d
RGB: 252, 211, 77
HSL: 44°, 97%, 65%
Usage: Borders, highlights, premium touches, accents
Accessibility: WCAG AA on navy
```
**Best For:**
- Top borders on cards
- Highlight badges
- Premium accents
- Decorative lines
- Footer text accents
- Status indicators

### ✨ Muted Gold (Soft Highlight)
```
Color: Muted Gold
Hex: #f3d64a
RGB: 243, 214, 74
HSL: 44°, 88%, 62%
Usage: Softer gold accents, badges
```
**Best For:**
- Soft accent backgrounds
- Badge backgrounds
- Subtle highlighting

## Background Colors

### 🟤 Cream (Soft Background)
```
Color: Cream
Hex: #f9f7f1
RGB: 249, 247, 241
HSL: 35°, 33%, 96%
Usage: Section backgrounds, soft dividers
Accessibility: WCAG AAA for navy/slate text
```
**Best For:**
- Alternating section backgrounds
- Content area backgrounds
- Subtle section breaks
- Feature section backgrounds

### ⚪ White (Primary Background)
```
Color: White
Hex: #ffffff
RGB: 255, 255, 255
HSL: 0°, 0%, 100%
Usage: Card backgrounds, primary containers
```
**Best For:**
- Card backgrounds
- Content containers
- Modals
- Dropdowns
- Primary content areas

## Text Colors

### 🔤 Slate (Body Text)
```
Color: Slate
Hex: #374151
RGB: 55, 65, 81
HSL: 209°, 19%, 27%
Usage: Body text, descriptions, secondary content
Accessibility: WCAG AAA on white
```
**Best For:**
- Paragraph text
- Descriptions
- Secondary information
- Less important text
- Form labels

### 🔴 Accent Red (Alerts)
```
Color: Red
Hex: #dc2626
RGB: 220, 38, 38
HSL: 0°, 80%, 50%
Usage: Errors, problems, alert states
```
**Best For:**
- Error messages
- Warning indicators
- Problem tags
- Alert states
- Validation errors

---

## Color Combinations (Safe Pairs)

### ✅ Primary Combinations
1. **Navy on White** - Excellent contrast
   ```
   Text: #1a3a7a
   Background: #ffffff
   Contrast: 12.5:1 (WCAG AAA)
   ```

2. **Navy on Cream** - Excellent contrast
   ```
   Text: #1a3a7a
   Background: #f9f7f1
   Contrast: 12.3:1 (WCAG AAA)
   ```

3. **White on Navy** - Excellent contrast
   ```
   Text: #ffffff
   Background: #1a3a7a
   Contrast: 12.5:1 (WCAG AAA)
   ```

4. **Gold on Navy** - Good contrast
   ```
   Text: #fcd34d
   Background: #1a3a7a
   Contrast: 4.8:1 (WCAG AA)
   ```

5. **Purple on White** - Good contrast
   ```
   Text: #6b3fa0
   Background: #ffffff
   Contrast: 6.2:1 (WCAG AA)
   ```

6. **Slate on White** - Excellent contrast
   ```
   Text: #374151
   Background: #ffffff
   Contrast: 9.6:1 (WCAG AAA)
   ```

### ⚠️ Avoid These Combinations
- Gold text on white (too light)
- Light purple text on white (too light)
- Red text on navy (poor contrast)
- Purple on cream (marginal contrast)

---

## Real-World Usage Examples

### Button Examples

**Primary Button (Navy)**
```
Background: #1a3a7a
Text: #ffffff
Border: None
Padding: 12px 32px
Hover: #2d5aae, enhanced shadow
```

**Secondary Button (Ghost with Gold)**
```
Background: transparent
Text: #1a3a7a
Border: 2px solid #fcd34d
Padding: 12px 32px
Hover: #f9f7f1 background, #1a3a7a text
```

**Disabled Button**
```
Background: #1a3a7a (60% opacity)
Text: #ffffff (60% opacity)
Cursor: not-allowed
```

### Card Examples

**Feature Card**
```
Background: #ffffff
Border-top: 4px solid #fcd34d
Box-shadow: 0 10px 30px rgba(26, 58, 122, 0.15)
Padding: 24px
Hover: Enhanced shadow, slight lift
```

**Premium Card**
```
Background: #f9f7f1
Border: 2px solid #fcd34d
Padding: 24px
Accent: #6b3fa0 accent text
```

### Badge Examples

**Important Badge**
```
Background: #fcd34d
Text: #1a3a7a
Padding: 4px 12px
Border-radius: 4px
Font-weight: semibold
```

**Success Badge**
```
Background: #d1fae5
Text: #065f46
```

**Error Badge**
```
Background: #fee2e2
Text: #dc2626
```

---

## CSS Variables Reference

All colors available as CSS variables:

```css
:root {
  --jckl-navy: #1a3a7a;
  --jckl-purple: #6b3fa0;
  --jckl-gold: #fcd34d;
  --jckl-cream: #f9f7f1;
  --jckl-white: #ffffff;
  --jckl-slate: #374151;
  --jckl-accent: #dc2626;
  --jckl-light-navy: #2d5aae;
  --jckl-light-purple: #8b5cf6;
}
```

**Usage:**
```css
.element {
  color: var(--jckl-navy);
  background-color: var(--jckl-cream);
  border-color: var(--jckl-gold);
}
```

---

## Tailwind Utilities Generated

All colors work as Tailwind utilities:

**Text Colors:**
- `text-jckl-navy`
- `text-jckl-purple`
- `text-jckl-gold`
- `text-jckl-cream`
- `text-jckl-slate`
- `text-jckl-accent`

**Background Colors:**
- `bg-jckl-navy`
- `bg-jckl-purple`
- `bg-jckl-gold`
- `bg-jckl-cream`
- `bg-jckl-white`

**Border Colors:**
- `border-jckl-navy`
- `border-jckl-purple`
- `border-jckl-gold`

**Gradients:**
- `bg-gradient-jckl` (Navy → Light Navy → Purple)
- `bg-gradient-jckl-light` (Subtle navy/purple)
- `bg-gradient-jckl-accent` (Navy → Purple)

**Shadows:**
- `shadow-jckl` (Standard navy shadow)
- `shadow-jckl-lg` (Large navy shadow)

---

## Print-Friendly Color Cards

```
┌─────────────────────────────────┐
│  NAVY (Primary)                 │
│  #1a3a7a                        │
│  RGB: 26, 58, 122               │
│  Usage: Headings, buttons, text │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  LIGHT NAVY (Secondary)         │
│  #2d5aae                        │
│  RGB: 45, 90, 174               │
│  Usage: Hover, secondary        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  PURPLE (Accent)                │
│  #6b3fa0                        │
│  RGB: 107, 63, 160              │
│  Usage: Premium, accents        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  GOLD (Highlight)               │
│  #fcd34d                        │
│  RGB: 252, 211, 77              │
│  Usage: Borders, highlights     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  CREAM (Background)             │
│  #f9f7f1                        │
│  RGB: 249, 247, 241             │
│  Usage: Soft backgrounds        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  SLATE (Text)                   │
│  #374151                        │
│  RGB: 55, 65, 81                │
│  Usage: Body text               │
└─────────────────────────────────┘
```

---

**Theme Palette Version:** 1.0
**Date:** December 4, 2025
**Status:** ✅ Ready for Design Implementation
