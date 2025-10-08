# 🚀 Quick Start Guide

## Run the App in 2 Minutes

```bash
# 1. Navigate to the project
cd wellness-marketplace

# 2. Set up Google Maps API key (required)
cp .env.example .env.local
# Edit .env.local and add your Google Maps API key
# Get one free at: https://console.cloud.google.com/

# 3. Start the development server
npm run dev

# 4. Open http://localhost:3000 in your browser
```

**Need a Google Maps API key?** See [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) for a 5-minute setup guide.

That's it! 🎉

## What You'll See

### 🖥️ Desktop View
- **Left Half**: Scrollable list of wellness services with beautiful cards
- **Right Half**: Interactive map with markers
- **Top**: Search bar with category filter chips

### 📱 Mobile View  
- Toggle button to switch between list and map
- Full-screen experience for each view

## Try These Features

### 🔍 Search
Type in the search bar:
- Service names: "Zenith", "Serenity", "Core"
- Neighborhoods: "SoHo", "Chelsea", "Tribeca"
- Cities: "New York"

### 🏷️ Filter by Category
Click the chips at the top:
- **All** - Shows everything (12 listings)
- **Gym** - 3 listings
- **Yoga** - 2 listings
- **Massage** - 2 listings
- **Pilates** - 2 listings
- **Spa** - 2 listings
- **Meditation** - 1 listing

### 🎯 Interactive Map
- **Click a card** → Map pans to that location
- **Click a map marker** → Card highlights and scrolls into view
- **Hover markers** → They scale up
- **Zoom/pan** → Use controls or mouse/touch gestures

### ✨ Visual Polish
- **Hover cards** → Subtle lift with shadow
- **Highlighted items** → Emerald ring on card, larger green marker on map
- **Smooth animations** → Scroll, pan, zoom, transitions
- **Light green theme** → Calming emerald palette throughout

## Quick Edits

### Add a New Listing

Edit `lib/mockData.ts` and add:

```typescript
{
  id: '13',
  name: 'Your Studio Name',
  category: 'Yoga',
  rating: 4.9,
  reviewCount: 150,
  neighborhood: 'Brooklyn Heights',
  city: 'New York',
  image: 'https://images.unsplash.com/photo-YOUR-IMAGE-ID',
  coordinates: { lat: 40.6940, lng: -73.9950 }
}
```

Save and refresh - it will appear instantly!

### Change the Color Theme

In your components, replace `emerald` with any color:
- `emerald-500` → `teal-500`
- `emerald-50` → `green-50`
- etc.

### Change Map Style

Edit `components/WellnessMap.tsx`, line 22:

```typescript
// Current (light)
style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

// Dark alternative
style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

// Colorful alternative
style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
```

## Build for Production

```bash
npm run build
npm start
```

## Tech Stack Summary

- **Next.js 15** - React framework with App Router + Turbopack
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling (note: v4 uses new `@import "tailwindcss"` syntax)
- **Google Maps API** - Professional mapping with $200/month free credit
- **Unsplash** - High-quality images

## Common Questions

**Q: Do I need API keys?**  
A: Yes, you need a Google Maps API key. But it's free to get and includes $200/month credit (28,500+ free map loads). See [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) for setup.

**Q: Can I use real data?**  
A: Yes! Replace the mock data in `lib/mockData.ts` with your API calls or database queries.

**Q: Is it mobile responsive?**  
A: Fully! Try resizing your browser or opening on mobile.

**Q: Can I deploy this?**  
A: Yes! Deploy to Vercel, Netlify, or any Next.js host with one click.

## Need Help?

- Check the main README.md for full documentation
- Inspect browser DevTools to see how components work
- All code is commented and self-explanatory

Enjoy building! 🧘‍♀️💚

