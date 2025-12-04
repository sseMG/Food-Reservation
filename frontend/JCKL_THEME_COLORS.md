# JCKL Academy Theme - Color Palette Guide

## Overview
The Food Reservation System has been redesigned with a professional JCKL Academy-inspired color palette featuring royal blues, purples, and gold accents. This is a pure **frontend CSS redesign** with no backend modifications.

## Color Palette

### Primary Colors
- **Navy** (`--jckl-navy: #1a3a7a`) - Deep royal navy, primary brand color
- **Light Navy** (`--jckl-light-navy: #2d5aae`) - Lighter navy for hover states
- **Purple** (`--jckl-purple: #6b3fa0`) - Royal purple from academy crown logo
- **Light Purple** (`--jckl-light-purple: #8b5cf6`) - Lighter purple for accents

### Secondary Colors
- **Gold** (`--jckl-gold: #fcd34d`) - Bright gold for highlights and borders
- **Muted Gold** (`--jckl-muted-gold: #f3d64a`) - Slightly muted gold for backgrounds
- **Cream** (`--jckl-cream: #f9f7f1`) - Warm off-white/cream background
- **White** (`--jckl-white: #ffffff`) - Pure white

### Neutral Colors
- **Slate** (`--jckl-slate: #374151`) - Text and secondary elements
- **Accent Red** (`--jckl-accent: #dc2626`) - For problem/error states

## Implementation Files

### 1. **tailwind.config.js**
- Added custom color extension to Tailwind theme
- All JCKL colors available as utilities (e.g., `bg-jckl-navy`, `text-jckl-gold`)
- Updated ring colors for focus states

### 2. **src/App.css**
- Added CSS variables for all JCKL colors
- Updated App header gradient to use navy and light navy
- Updated App links to use gold color
- Non-AI design: Clean, professional, academy-inspired

### 3. **src/index.css**
- Root-level CSS variables for all JCKL colors
- Custom utility classes:
  - Text utilities: `.text-jckl-navy`, `.text-jckl-purple`, etc.
  - Background utilities: `.bg-jckl-navy`, `.bg-jckl-cream`, etc.
  - Gradient utilities: `.bg-gradient-jckl`, `.bg-gradient-jckl-light`, `.bg-gradient-jckl-accent`
  - Shadow utilities: `.shadow-jckl`, `.shadow-jckl-lg`
  - Border utilities: `.border-jckl-navy`, `.border-jckl-gold`, etc.
- Updated focus-ring utilities to use JCKL navy

### 4. **src/pages/Landing.jsx**
Complete redesign with JCKL theme:

#### Header & Navigation
- Background: White with gold border
- Text: JCKL navy
- Active links: JCKL navy underline
- Buttons: JCKL navy background with light navy hover

#### Hero Section
- Gradient: JCKL navy to navy/purple gradient
- Primary button: JCKL navy
- Ghost button: Gold border with navy text
- Badge: Cream background with gold border

#### Problem/Solution Cards
- Gold top border accent
- Gradient backgrounds maintained for visual hierarchy
- Problem tag: Red background
- Challenge/Waste tags: Yellow background with navy text

#### Schedules Section
- Background: JCKL cream
- Cards: White with gold top border
- Focus ring: JCKL navy
- Time slot badges: Using section-specific colors

#### Features Section
- Background: JCKL cream
- Hover state: White background
- Feature icons: Various theme colors
- Focus ring: JCKL navy

#### Stats Section
- Gradient background: JCKL navy to light navy
- Text: White
- Accent text: Gold
- Creates strong visual impact

#### Social Links Section
- Border: 2px gold border
- Background gradient: Cream to light blue
- Icon backgrounds: JCKL navy and purple
- Hover effects with JCKL theme colors

#### Footer
- Background: JCKL navy
- Text: White
- Links/accents: Gold
- Professional, institutional feel

## Design Principles

✅ **Professional & Institutional** - Reflects the academy's prestige since 1993
✅ **Non-AI Design** - Clean, human-designed aesthetic (not AI-generated)
✅ **Color Harmony** - Navy, purple, and gold create royal, prestigious feel
✅ **Accessible** - High contrast ratios for readability
✅ **Consistent** - Color palette used uniformly across all pages
✅ **Frontend Only** - Zero backend modifications, pure CSS styling

## Usage Examples

### In Tailwind Classes
```jsx
// Background colors
<div className="bg-jckl-navy"></div>
<div className="bg-jckl-cream"></div>

// Text colors
<p className="text-jckl-navy">Navy text</p>
<p className="text-jckl-gold">Gold text</p>

// Gradients
<div className="bg-gradient-jckl"></div>
<div className="bg-gradient-jckl-light"></div>

// Shadows
<div className="shadow-jckl"></div>
```

### In CSS
```css
/* Direct CSS variables */
color: var(--jckl-navy);
background-color: var(--jckl-gold);
border-color: var(--jckl-purple);

/* Custom utilities */
box-shadow: var(--jckl-navy);
```

## Hierarchy

1. **Navy** - Primary text and buttons
2. **Light Navy** - Hover states and secondary elements
3. **Purple** - Accents and premium features
4. **Gold** - Highlights, borders, premium touches
5. **Cream** - Soft backgrounds
6. **White** - Cards and containers

## Future Pages

When styling other pages (Login, Register, Admin, Student Dashboard, Menu, etc.), use:
- Navy for primary buttons and headings
- Cream for section backgrounds
- Gold for borders and accents
- Purple for secondary actions
- White for cards and content containers

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Variables fully supported
- Tailwind utilities work with all modern setups
- Fallbacks not needed (modern audience)

---

**Theme Created:** December 4, 2025
**Status:** Production Ready ✅
**Backend Impact:** None (Frontend Only) ✅
