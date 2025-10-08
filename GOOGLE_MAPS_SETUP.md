# 🗺️ Google Maps API Setup Guide

## Quick Setup (5 Minutes)

### 1. Get Your Google Maps API Key

#### Step 1: Go to Google Cloud Console
Visit: [https://console.cloud.google.com/](https://console.cloud.google.com/)

#### Step 2: Create a New Project (or Select Existing)
1. Click on the project dropdown at the top
2. Click "New Project"
3. Name it something like "Wellness Marketplace"
4. Click "Create"

#### Step 3: Enable Google Maps JavaScript API
1. Go to: [https://console.cloud.google.com/google/maps-apis](https://console.cloud.google.com/google/maps-apis)
2. Click **"Enable APIs and Services"**
3. Search for **"Maps JavaScript API"**
4. Click on it and click **"Enable"**

#### Step 4: Create API Key
1. Go to: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"Create Credentials"** → **"API Key"**
3. Your API key will be generated (looks like: `AIzaSyD...`)
4. Click **"Restrict Key"** (recommended for security)

#### Step 5: Restrict API Key (Recommended)
1. Under **"API restrictions"**:
   - Select "Restrict key"
   - Check **"Maps JavaScript API"**
2. Under **"Website restrictions"**:
   - Select "HTTP referrers"
   - Add: `localhost:3000/*` (for development)
   - Add: `yourdomain.com/*` (for production)
3. Click **"Save"**

### 2. Add API Key to Your Project

#### Create `.env.local` file:
```bash
cd wellness-marketplace
cp .env.example .env.local
```

#### Edit `.env.local` and add your key:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD_your_actual_key_here
```

**Important:** 
- The file MUST be named `.env.local` (not `.env`)
- The variable MUST start with `NEXT_PUBLIC_` to work in the browser
- Replace `AIzaSyD_your_actual_key_here` with your actual key

### 3. Restart Your Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you should see the Google Map!

## 🎉 Features

### Custom Emerald Markers
- Light emerald circles for regular markers
- Dark emerald circles for highlighted markers
- White border for visibility
- Smooth animations on click

### Interactive Behavior
- **Click a card** → Marker bounces and map pans to location
- **Click a marker** → Card highlights and scrolls into view
- **Auto-fit bounds** → Automatically shows all visible markers
- **Smooth pan/zoom** → Professional map transitions

### Styling
- Clean, minimal Google Maps interface
- Hidden POI (points of interest) labels for cleaner look
- Zoom controls visible
- Map type, street view, and fullscreen controls hidden
- Matches the light-green wellness theme

## 💰 Pricing

### Free Tier (More than enough for development)
- **$200 free credit per month**
- Maps JavaScript API: **$7 per 1,000 loads**
- **28,500+ free map loads per month**
- No credit card required initially

### Development vs Production

**Development:**
- Restrict to `localhost:3000/*`
- Track usage in Google Cloud Console
- Free tier is usually plenty

**Production:**
- Set up billing (required for production use)
- Restrict to your domain
- Monitor usage to avoid unexpected charges
- Consider caching strategies

## 🔒 Security Best Practices

### ✅ DO:
- Restrict API key to specific domains
- Restrict to only Maps JavaScript API
- Use different keys for dev/staging/production
- Monitor usage regularly
- Set up budget alerts in Google Cloud

### ❌ DON'T:
- Commit API keys to Git (use `.env.local`)
- Share API keys publicly
- Use unrestricted keys in production
- Forget to set up billing alerts

## 🚨 Troubleshooting

### Map shows "For development purposes only"
**Solution:** You need to enable billing in Google Cloud Console. The free $200/month credit still applies!

### Map doesn't load
**Check:**
1. Is your API key correct in `.env.local`?
2. Did you restart the dev server after adding the key?
3. Is Maps JavaScript API enabled in Google Cloud?
4. Check browser console for error messages

### "RefererNotAllowedMapError"
**Solution:** Add your domain to the API key restrictions in Google Cloud Console.

### Markers not showing
**Check:**
1. Are coordinates valid? (lat/lng in correct order)
2. Is the map zoomed out enough to see markers?
3. Check browser console for errors

## 🎨 Customization

### Change Marker Colors
Edit `components/WellnessMap.tsx`:

```typescript
const getMarkerIcon = (isHighlighted: boolean): google.maps.Symbol => {
  return {
    fillColor: isHighlighted ? '#10b981' : '#6ee7b7', // Change these colors
    // ... other properties
  };
};
```

### Change Map Style
Edit `mapOptions` in `components/WellnessMap.tsx`:

```typescript
const mapOptions = {
  styles: [
    // Add custom map styles here
    // Get styles from: https://snazzymaps.com/
  ],
};
```

### Add Custom Controls
```typescript
const mapOptions = {
  zoomControl: true,        // Show zoom buttons
  mapTypeControl: true,     // Show map/satellite toggle
  streetViewControl: true,  // Show street view pegman
  fullscreenControl: true,  // Show fullscreen button
};
```

## 📚 Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [React Google Maps API Docs](https://react-google-maps-api-docs.netlify.app/)
- [Custom Map Styles](https://snazzymaps.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Pricing Calculator](https://mapsplatformtransition.withgoogle.com/calculator)

## 🔄 Switching Back to MapLibre

If you want to use free maps without an API key:

```bash
npm install maplibre-gl
npm uninstall @react-google-maps/api
```

Then restore the original `WellnessMap.tsx` component that uses MapLibre.

---

**You're all set!** 🎉 Your wellness marketplace now has a beautiful Google Maps integration with custom emerald markers and smooth interactions.

