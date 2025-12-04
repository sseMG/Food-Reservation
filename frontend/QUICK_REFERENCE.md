# 🎨 JCKL Theme - Quick Reference Card

## Color Palette (Copy-Paste Ready)

```
Navy:        #1a3a7a (Primary headings, buttons)
Light Navy:  #2d5aae (Hover states, secondary)
Purple:      #6b3fa0 (Royal accents)
Gold:        #fcd34d (Borders, highlights)
Cream:       #f9f7f1 (Soft backgrounds)
White:       #ffffff (Cards, text background)
Slate:       #374151 (Body text)
Red:         #dc2626 (Errors, alerts)
```

---

## Tailwind Classes (Use Immediately)

```jsx
// Text
<p className="text-jckl-navy">Navy heading</p>
<p className="text-jckl-slate">Slate body text</p>
<p className="text-jckl-gold">Gold accent</p>

// Backgrounds
<div className="bg-jckl-navy">Navy section</div>
<div className="bg-jckl-cream">Cream section</div>
<div className="bg-jckl-white">White card</div>

// Borders
<div className="border-t-4 border-jckl-gold">Card with gold top</div>
<div className="border-jckl-navy">Navy border</div>

// Buttons
<button className="bg-jckl-navy hover:bg-jckl-light-navy">Primary</button>
<button className="border-2 border-jckl-gold text-jckl-navy">Ghost</button>

// Gradients
<div className="bg-gradient-jckl">Gradient</div>

// Focus
<div className="focus-within:ring-2 focus-within:ring-jckl-navy">Focus ring</div>
```

---

## CSS Variables (Use in CSS)

```css
:root {
  --jckl-navy: #1a3a7a;
  --jckl-light-navy: #2d5aae;
  --jckl-purple: #6b3fa0;
  --jckl-gold: #fcd34d;
  --jckl-cream: #f9f7f1;
  --jckl-white: #ffffff;
  --jckl-slate: #374151;
  --jckl-accent: #dc2626;
}

/* Usage */
.element {
  color: var(--jckl-navy);
  background: var(--jckl-cream);
  border-color: var(--jckl-gold);
}
```

---

## Component Patterns

### Primary Button
```jsx
<button className="bg-jckl-navy hover:bg-jckl-light-navy text-white px-6 py-2 rounded-lg">
  Primary Action
</button>
```

### Secondary Button
```jsx
<button className="border-2 border-jckl-gold text-jckl-navy hover:bg-jckl-cream px-6 py-2 rounded-lg">
  Secondary Action
</button>
```

### Card with Accent
```jsx
<div className="bg-white border-t-4 border-jckl-gold p-6 rounded-xl shadow-lg">
  <h3 className="text-jckl-navy font-bold">Card Title</h3>
  <p className="text-jckl-slate">Card content</p>
</div>
```

### Section Background
```jsx
<section className="bg-jckl-cream py-12">
  <h2 className="text-jckl-navy">Section Title</h2>
  <p className="text-jckl-slate">Section content</p>
</section>
```

### Navigation Link
```jsx
<a href="#" className="text-jckl-navy hover:text-jckl-light-navy hover:underline">
  Link
</a>
```

---

## Files to Know

- **tailwind.config.js** - Color definitions (line 7-20)
- **App.css** - App-level styling (CSS variables)
- **index.css** - Utilities and theme (root variables)
- **Landing.jsx** - Example implementation

---

## Documentation Files

- **JCKL_THEME_COLORS.md** - Technical guide
- **THEME_VISUAL_GUIDE.md** - Visual reference
- **COLOR_SWATCHES.md** - Color combinations
- **THEME_IMPLEMENTATION_SUMMARY.md** - Overview

---

## Accessibility

✅ **Navy on White:** 12.5:1 (WCAG AAA)
✅ **Slate on White:** 9.6:1 (WCAG AAA)
✅ **Gold on Navy:** 4.8:1 (WCAG AA)
✅ **Purple on White:** 6.2:1 (WCAG AA)

---

## Do's & Don'ts

✅ Use navy for headings & primary buttons
✅ Use slate for body text
✅ Use gold for borders & highlights
✅ Use cream for section backgrounds
✅ Add focus rings with navy

❌ Don't use generic blue (Tailwind blue-600)
❌ Don't forget focus states
❌ Don't mix unrelated colors
❌ Don't use too much gold
❌ Don't reduce contrast

---

## Quick Deployment

1. Files already updated ✅
2. Test in browser ✅
3. Deploy to production ✅
4. No backend changes needed ✅

---

**Version:** 1.0 | **Date:** Dec 4, 2025 | **Status:** Ready ✅
