# JCKL Academy Theme - Visual Implementation

## Color Reference Card

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Primary Navy | Deep Navy | #1a3a7a | Headers, primary buttons, main text |
| Light Navy | Light Navy | #2d5aae | Hover states, secondary elements, borders |
| Royal Purple | Purple | #6b3fa0 | Accents, premium features |
| Light Purple | Light Purple | #8b5cf6 | Hover states on purple elements |
| Gold Accent | Gold | #fcd34d | Highlights, borders, premium touches |
| Muted Gold | Muted Gold | #f3d64a | Subtle accents, badges |
| Background | Cream | #f9f7f1 | Soft backgrounds, section dividers |
| White | Pure White | #ffffff | Cards, containers, text backgrounds |
| Text | Slate | #374151 | Body text, descriptions |
| Accent Red | Red | #dc2626 | Errors, problems, alerts |

## Page-by-Page Color Implementation

### Landing Page (Home)
- **Header**: White background, gold bottom border
- **Navigation Links**: Navy text, hover light-navy
- **Hero Section**: Navy-to-purple gradient background
- **CTA Buttons**: Navy background, white text
- **Cards**: White with gold top border
- **Section Backgrounds**: Alternating white and cream
- **Footer**: Navy background, gold text accents

### Navigation Elements
- **Active Link**: Navy text with navy underline
- **Inactive Links**: Slate text, hover navy
- **Mobile Menu**: White background, cream hover
- **Buttons**: Navy background, light-navy hover

### Content Cards
- **Card Background**: White
- **Card Border**: Gold top border (2-4px)
- **Card Shadow**: Navy with transparency
- **Hover State**: Enhanced shadow, slight lift

### Form Elements (For other pages)
- **Input Focus**: Navy ring outline
- **Submit Buttons**: Navy background
- **Cancel/Secondary**: Ghost style with gold border
- **Error States**: Red accent text

### Badges & Tags
- **Important**: Gold background, navy text
- **Info**: Navy background, white text
- **Success**: Green background (maintain)
- **Warning**: Gold background, navy text
- **Error**: Red background, white text

### Component Hierarchy

**Primary Level** - Navy (headlines, primary actions)
```
- Main titles (h1, h2)
- Primary buttons
- Primary navigation
- Hero section
```

**Secondary Level** - Light Navy (secondary actions)
```
- Subheadings (h3, h4)
- Secondary buttons
- Links
- Hover states
```

**Accent Level** - Purple & Gold
```
- Feature highlights
- Icon backgrounds
- Premium elements
- Visual accents
```

**Neutral Level** - Slate & Cream
```
- Body text
- Descriptions
- Section backgrounds
- Secondary content
```

## Interactive States

### Button States

**Navy Primary Button**
- Default: `#1a3a7a` with white text
- Hover: `#2d5aae` with white text, enhanced shadow
- Active: `#1a3a7a` with shadow inset
- Disabled: `#1a3a7a` at 60% opacity

**Gold Outlined Button (Ghost)**
- Default: Transparent, `#fcd34d` border (2px), navy text
- Hover: `#f9f7f1` background, `#1a3a7a` text
- Active: `#fcd34d` background, navy text
- Disabled: Fade to 60% opacity

### Link States

- Default: Navy text, no underline
- Hover: Navy text, navy underline
- Visited: Light navy text
- Focus: Navy ring outline (2px offset)

### Input States

- Default: Navy text, gray border
- Focus: Navy ring outline (2px), navy border
- Error: Red border, red text
- Disabled: Gray text, gray background

## Spacing & Sizing

### Navigation
- Header height: 56px (sm), 64px (lg)
- Nav items: 8px gap (sm), 32px gap (lg)
- Logo size: 32px (sm), 40px (lg)

### Sections
- Padding: 24px (py-6), 48px (py-12), 96px (py-24)
- Max width: 1344px (6xl container)
- Horizontal padding: 24px (mobile), 96px (desktop)

### Cards
- Padding: 24px (p-6)
- Border radius: 12px (rounded-lg), 16px (rounded-xl), 20px (rounded-2xl)
- Gap: 8px (gap-2), 16px (gap-4), 24px (gap-6), 32px (gap-8)

## Typography with Theme

### Headings
- Color: Navy (`#1a3a7a`)
- h1: 48px (mobile), 84px (desktop), bold, navy
- h2: 32px (mobile), 48px (desktop), bold, navy
- h3: 24px, bold, navy
- h4: 20px, semibold, navy

### Body Text
- Color: Slate (`#374151`)
- Font size: 16px (base), 18px (lg), 14px (sm)
- Line height: 1.5-1.75

### Accents
- Color: Gold (`#fcd34d`) for highlights
- Color: Purple (`#6b3fa0`) for premium text

## Gradients

### Hero Gradient
```css
background: linear-gradient(135deg, #1a3a7a 0%, #2d5aae 50%, #6b3fa0 100%);
```

### Light Gradient
```css
background: linear-gradient(135deg, rgba(26, 58, 122, 0.05) 0%, rgba(107, 63, 160, 0.05) 100%);
```

### Section Divider
```css
background: linear-gradient(135deg, #1a3a7a 0%, #6b3fa0 100%);
```

## Shadow System

### Subtle
```css
box-shadow: 0 4px 6px rgba(26, 58, 122, 0.07);
```

### Standard
```css
box-shadow: 0 10px 30px rgba(26, 58, 122, 0.15);
```

### Elevated
```css
box-shadow: 0 20px 40px rgba(26, 58, 122, 0.2);
```

## Accessibility Considerations

✅ Navy on white: 12.5:1 contrast ratio (WCAG AAA)
✅ Gold on navy: 4.8:1 contrast ratio (WCAG AA)
✅ Slate on white: 9.6:1 contrast ratio (WCAG AAA)
✅ Purple on white: 6.2:1 contrast ratio (WCAG AA)

**Focus Indicators:**
- Navy ring: 2px, 2px offset
- Visible on all interactive elements
- High contrast with all backgrounds

## Design Philosophy

🎓 **Academic Prestige** - Navy and purple convey authority and tradition
✨ **Royal Heritage** - Gold accents reference the academy crown from the logo
🌟 **Professional** - Clean, not cluttered; minimal but impactful
🎯 **Consistent** - Same palette throughout all pages for brand cohesion
♿ **Accessible** - High contrast, clear focus states, readable typography

## Do's and Don'ts

### ✅ Do's
- Use navy for primary actions and headlines
- Add gold borders/highlights for premium elements
- Maintain cream backgrounds for section division
- Use purple for secondary/accent elements
- Keep white backgrounds for content cards

### ❌ Don'ts
- Don't use generic blue (Bootstrap colors)
- Don't mix with random other colors
- Don't reduce contrast for decorative purposes
- Don't use too much gold (accent only)
- Don't forget focus states on interactive elements

## Quality Checklist

- [ ] All buttons use navy or ghost style with gold border
- [ ] All cards have white background with gold top border
- [ ] Section backgrounds alternate white/cream
- [ ] Headers use navy text
- [ ] Body text uses slate
- [ ] All links are navy with hover effect
- [ ] All interactive elements have navy focus ring
- [ ] Gradients use navy → purple consistently
- [ ] Footer is navy background with gold text
- [ ] Social links use navy and purple icons
- [ ] Badges match theme color system
- [ ] Hover states are light-navy or include shadow
- [ ] No random colors outside the palette

---

**Theme Design Guidelines**
**Effective:** December 4, 2025
**Status:** Ready for Implementation ✅
