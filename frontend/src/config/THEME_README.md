# Theme Customization Guide

## 📍 Configuration File Location
**`/frontend/src/config/theme.json`**

This is your single source of truth for all accent colors and gradients in the app.

---

## 🎨 How to Change Accent Colors

### 1. Edit the `accent` section in `theme.json`:

```json
{
  "accent": {
    "primary": "#6366f1",    ← Change this to your first color
    "secondary": "#8b5cf6"   ← Change this to your second color
  }
}
```

### 2. Use any hex color you want:

**Examples:**
- Blue to Cyan: `"primary": "#3b82f6", "secondary": "#06b6d4"`
- Pink to Rose: `"primary": "#ec4899", "secondary": "#f43f5e"`
- Orange to Red: `"primary": "#f59e0b", "secondary": "#ef4444"`
- Green to Emerald: `"primary": "#10b981", "secondary": "#059669"`
- Purple to Fuchsia: `"primary": "#a855f7", "secondary": "#d946ef"`

### 3. Save the file - changes apply instantly!

---

## 🔧 What Uses These Colors?

### Automatically Applied To:

1. **Card Hover Effects**
   - Cards glow with your accent gradient on hover
   - Border changes to primary accent color
   - Shadow uses both gradient colors

2. **Buttons** (with `.btn-gradient` class)
   - Background uses gradient
   - Hover effect with gradient shadow
   - Lift animation on hover

3. **Borders** (with `.border-gradient` class)
   - Animated gradient borders
   - Works in light and dark mode

4. **Text** (with `.text-gradient` class)
   - Gradient text effects
   - Automatically clips to text

---

## 🎯 Available CSS Classes

Add these classes to any element:

### `.btn-gradient`
Creates a button with gradient background and hover effects
```jsx
<button className="btn-gradient px-4 py-2 rounded">
  Click Me
</button>
```

### `.border-gradient`
Adds animated gradient border
```jsx
<div className="border-gradient p-4 rounded">
  Content with gradient border
</div>
```

### `.text-gradient`
Makes text use the gradient colors
```jsx
<h1 className="text-gradient text-4xl font-bold">
  Gradient Text
</h1>
```

### `.card-gradient-hover`
Automatically applied to all Card components - adds gradient glow on hover

---

## ⚙️ Advanced Customization

### Adjust Shadow Intensity

In `theme.json`:
```json
{
  "shadows": {
    "card": {
      "hoverOpacity": 0.2  ← Change to 0.1 (subtle) or 0.5 (intense)
    }
  }
}
```

### Enable/Disable Border Glow

```json
{
  "effects": {
    "borderGlow": {
      "enabled": true,      ← Set to false to disable
      "opacity": 0.3        ← Adjust glow strength
    }
  }
}
```

---

## 📦 Color Presets

Copy any of these into your `accent` section:

**Default (Indigo → Purple):**
```json
"primary": "#6366f1",
"secondary": "#8b5cf6"
```

**Ocean (Blue → Cyan):**
```json
"primary": "#3b82f6",
"secondary": "#06b6d4"
```

**Sunset (Orange → Red):**
```json
"primary": "#f59e0b",
"secondary": "#ef4444"
```

**Forest (Green → Emerald):**
```json
"primary": "#10b981",
"secondary": "#059669"
```

**Candy (Pink → Rose):**
```json
"primary": "#ec4899",
"secondary": "#f43f5e"
```

**Galaxy (Purple → Fuchsia):**
```json
"primary": "#a855f7",
"secondary": "#d946ef"
```

---

## 🚀 Quick Start

1. Open `/frontend/src/config/theme.json`
2. Change `primary` and `secondary` colors
3. Save the file
4. Refresh your browser
5. See the magic! ✨

---

## 💡 Tips

- Use colors that have good contrast in both light and dark modes
- Test your colors with both theme toggles
- Start with one of the presets and adjust from there
- The gradient goes from primary (top-left) to secondary (bottom-right)
- All shadows and glows automatically use your chosen colors

---

## 🔍 CSS Variables Available

These are automatically injected into `:root`:

- `--accent-primary`: Your primary color
- `--accent-secondary`: Your secondary color
- `--shadow-hover-opacity`: Shadow opacity on hover
- `--border-glow-opacity`: Border glow opacity

Use them in custom CSS:
```css
.my-element {
  background: var(--accent-primary);
  border-color: var(--accent-secondary);
}
```
