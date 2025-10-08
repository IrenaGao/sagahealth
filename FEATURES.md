# ✨ Feature Overview

## 🎨 Visual Design

### Color Palette
```
Primary: Emerald Green (#10b981)
Light Accent: Emerald 50 (#ecfdf5)
Background: Gradient from emerald-50 via white to emerald-50
Text: Gray 900 (#111827)
Subtle: Gray 500-600 for secondary text
```

### Border Radius
- Cards, inputs, buttons: `rounded-xl` (0.75rem)
- Chips, badges: `rounded-lg` to `rounded-xl`
- Map markers: `border-radius: 50%` (perfect circles)

### Shadows
- Resting: `shadow-md`
- Hover: `shadow-lg`
- Highlighted: Custom ring with `ring-2 ring-emerald-500`

## 📐 Layout Breakdown

### Desktop (≥1024px)
```
┌─────────────────────────────────────────────────────┐
│  Search Input                          [Category]   │
│  [All] [Gym] [Massage] [Pilates] [Yoga] [Spa]...  │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│  Listing Cards       │    Interactive Map           │
│  (Scrollable)        │    (Sticky, full height)     │
│                      │                              │
│  ┌────────────────┐  │    🗺️ MapLibre GL           │
│  │ Image          │  │    📍 Custom markers         │
│  │ Name    [Cat]  │  │    🎯 Zoom controls          │
│  │ ★ 4.8 (212)    │  │                              │
│  │ Location       │  │                              │
│  └────────────────┘  │                              │
│  ┌────────────────┐  │                              │
│  │ ...more...     │  │                              │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
     50% width              50% width
```

### Mobile (<1024px)
```
┌────────────────────────┐
│  Search Input          │
│  Category Chips        │
│  [🗺️ Show Map Button] │
├────────────────────────┤
│                        │
│  Listing Cards         │
│  (Full width, scroll)  │
│                        │
│  ┌──────────────────┐  │
│  │ Card 1           │  │
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │ Card 2           │  │
│  └──────────────────┘  │
│                        │
└────────────────────────┘

Toggle to:

┌────────────────────────┐
│  Search Input          │
│  Category Chips        │
│  [📋 Show List Button] │
├────────────────────────┤
│                        │
│   Interactive Map      │
│   (Full screen)        │
│                        │
│   🗺️ MapLibre GL      │
│   📍 All markers       │
│   🎯 Controls          │
│                        │
└────────────────────────┘
```

## 🎯 Interactions

### Click a Listing Card
1. Card gets emerald ring highlight
2. Corresponding map marker:
   - Changes color: light emerald → dark emerald
   - Scales up: 24px → 28px
   - Increases z-index to appear on top
3. Map smoothly pans and zooms to marker location
4. Animation duration: 1 second (smooth flyTo)

### Click a Map Marker
1. Marker changes appearance (same as above)
2. Corresponding card gets emerald ring
3. List scrolls to bring card to center view
4. Smooth scroll animation

### Type in Search
1. Filters update in real-time (no debounce needed - fast!)
2. Both list AND map update simultaneously
3. Map auto-fits bounds to show all filtered results
4. Result count updates: "12 results" → "3 results"
5. Empty state shows if no matches

### Click Category Chip
1. Chip gets emerald background + white text
2. Other chips remain gray
3. List filters to show only that category
4. Map shows only markers for filtered items
5. Click "All" to reset

## 🎭 Animations & Transitions

### Card Hover
```css
transition: all 200ms ease
hover: {
  transform: translateY(-4px)
  shadow: shadow-lg
}
```

### Marker Hover
```css
transition: all 200ms ease
hover: {
  transform: scale(1.2)
}
```

### Chip Click
```css
transition: all 150ms ease
active: bg-emerald-500, text-white, shadow-md
inactive: bg-gray-100, text-gray-700
```

### Map Pan/Zoom
```javascript
flyTo({
  duration: 1000,
  essential: true, // respects prefers-reduced-motion
})
```

### List Scroll to Card
```javascript
scrollIntoView({
  behavior: 'smooth',
  block: 'center',
})
```

## 📊 Mock Data Structure

### 12 Pre-loaded Listings
- **Gyms**: Zenith Fitness, Equinox Greenwich, The Transformation Gym
- **Yoga**: Green Valley, Bliss Collective
- **Massage**: Serenity, Restore Deep Tissue
- **Pilates**: Core Studio, Balanced Body
- **Spa**: Urban Wellness, Tranquil Spa
- **Meditation**: Mindful Center

### Geographic Coverage
All listings are in NYC, spread across:
- West Village
- Chelsea
- SoHo
- Tribeca
- Midtown
- Upper West Side
- Greenwich Village
- East Village
- Flatiron
- Union Square
- Lower East Side
- Murray Hill

## 🗺️ Map Features

### Google Maps Integration
- **Professional mapping** powered by Google Maps JavaScript API
- **Free tier**: $200/month credit = 28,500+ free map loads
- **Reliable** and feature-rich

### Markers
- **Default**: 8-scale circle, light emerald (#6ee7b7)
- **Highlighted**: 10-scale circle, dark emerald (#10b981)
- **Border**: 2px white stroke
- **Animation**: Bounce effect on highlight
- **Interactive**: Click to select

### Controls
- Zoom in/out buttons (top-right)
- Map type control hidden (clean look)
- Street view control hidden
- Fullscreen control hidden
- Custom styling: minimal, clean interface

### Basemap
- Google Maps standard view
- POI (points of interest) labels hidden for cleaner look
- Custom styles can be added via Snazzymaps

### Auto-fit Bounds
- Shows all visible markers
- Automatic padding from edges
- Max zoom: 14 (prevents over-zooming on single result)
- Smooth transitions

## 🔍 Search & Filter Logic

### Search matches:
- Listing name (case-insensitive)
- Neighborhood name
- City name

### Filter behavior:
- Client-side (instant results)
- Combines with search (AND logic)
- "All" category shows everything

### Example Queries
- "gym" → 3 results (filters by name)
- "soho" → 1 result (filters by neighborhood)
- "massage" + category "Massage" → 2 results
- Empty search + "Yoga" → 2 results

## 📱 Responsive Breakpoints

### Tailwind Breakpoints Used
- `lg:` (1024px+) - Desktop split view
- `<lg` - Mobile stacked view

### Behavior Changes
| Feature | Desktop (lg+) | Mobile (<lg) |
|---------|---------------|--------------|
| Layout | 50/50 split | Stacked |
| Map visibility | Always visible | Toggle button |
| List scroll | Contained | Full height |
| Search bar | Full width | Full width |
| Category chips | Horizontal scroll | Horizontal scroll |

## 🎨 Custom Styling

### Hide Scrollbar (Category Chips)
```css
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { scrollbar-width: none; }
```

### Custom Scrollbar (List)
```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-thumb { background: #10b981; }
```

### Gradient Background
```css
background: linear-gradient(
  to bottom right,
  emerald-50 → white → emerald-50
)
```

## 🚀 Performance

### Optimizations
- **Next.js Image**: Auto-optimized Unsplash images
- **Client-side filtering**: No API calls, instant results
- **Memoized filtering**: `useMemo` prevents unnecessary re-renders
- **Lazy marker updates**: Only updates when listings/highlight change
- **Turbopack**: Fast dev server and builds

### Build Output
```
Route (app)         Size  First Load JS
○ /               258 kB         371 kB
```

Fully static, can be deployed to any CDN! 🚀

## 🎯 Use Cases

### As a User
1. Search for wellness services near me
2. Filter by type (gym, yoga, etc.)
3. See locations on a map
4. Click to learn more about each service
5. Compare ratings and reviews

### As a Developer
1. Clean component architecture
2. Easy to extend with real API data
3. TypeScript for type safety
4. Tailwind for rapid styling
5. MapLibre for map features

### As a Designer
1. Modern, clean aesthetic
2. Consistent spacing and sizing
3. Smooth animations
4. Accessible color contrast
5. Mobile-first responsive design

---

**Built with ❤️ using Next.js, TypeScript, Tailwind CSS, and MapLibre GL**

