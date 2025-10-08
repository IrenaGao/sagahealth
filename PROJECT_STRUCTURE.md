# 📁 Project Structure

## Current Directory Tree

```
sagahealth/
├── 📄 Configuration Files
│   ├── package.json              # Dependencies and scripts
│   ├── vite.config.js            # Vite configuration
│   ├── tailwind.config.js        # Tailwind CSS v3 config
│   ├── postcss.config.js         # PostCSS configuration
│   ├── .env.example              # Environment variables template
│   └── .env                      # Your actual credentials (gitignored)
│
├── 📝 Documentation
│   ├── README.md                 # Main project documentation
│   ├── MIGRATION_SUMMARY.md      # Migration details
│   ├── GOOGLE_MAPS_SETUP.md      # Maps API setup guide
│   ├── QUICKSTART.md             # Quick start guide
│   └── FEATURES.md               # Feature breakdown
│
├── 🎨 Frontend Source (src/)
│   ├── App.jsx                   # Main app wrapper (renders pages)
│   ├── main.jsx                  # React entry point
│   ├── index.css                 # Tailwind + global styles
│   ├── supabaseClient.js         # Supabase configuration
│   ├── pages/
│   │   └── WellnessMarketplace.jsx  # 🌟 Wellness marketplace page
│   └── components/
│       ├── ListingCard.jsx       # Provider card component
│       ├── SearchBar.jsx         # Search + category filters
│       └── WellnessMap.jsx       # Google Maps integration
│
├── 🌐 Public Assets
│   └── index.html                # HTML entry point
│
└── 📦 Build Output (generated)
    └── dist/                     # Production build
        ├── index.html
        └── assets/
            ├── index-[hash].css
            └── index-[hash].js
```

## Component Hierarchy

```
App.jsx (App Wrapper)
└── WellnessMarketplace.jsx (Page)
    ├── SearchBar
    │   ├── Search Input
    │   └── Category Chips (All, Gym, Massage, etc.)
    │
    ├── Mobile Toggle Button (shows/hides map on mobile)
    │
    └── Split View Container
    ├── Left Column (50%)
    │   ├── Loading State (spinner)
    │   ├── Error State (with retry button)
    │   ├── Empty State (no results)
    │   └── Listings Grid
    │       └── ListingCard (for each provider)
    │           ├── Image
    │           ├── Name + Category
    │           ├── Rating + Reviews
    │           └── Location
    │
    └── Right Column (50%)
        └── WellnessMap
            ├── Google Maps Container
            ├── Custom Markers (for each provider)
            └── Map Controls
```

## Data Flow

```
┌─────────────────┐
│   Supabase DB   │
│   (providers)   │
└────────┬────────┘
         │
         ↓ fetch on mount
┌─────────────────┐
│   App.jsx       │
│   - providers   │ ← state
│   - loading     │
│   - error       │
└────────┬────────┘
         │
         ├─────────→ SearchBar (search + filter)
         │            │
         ↓            ↓
    filteredListings  ←─ computed
         │
         ├─────────→ ListingCard (for each)
         │            │
         └─────────→ WellnessMap (with filtered data)
```

## File Responsibilities

### 🎨 Components

#### **App.jsx** (App Wrapper)
- Main application entry point
- Renders page components
- Can be extended for routing, global state, etc.

#### **WellnessMarketplace.jsx** (Page Component)
- Fetches providers from Supabase
- Manages state (providers, search, category, highlighted)
- Filters listings based on search and category
- Handles card/marker click interactions
- Responsive layout (mobile/desktop)

#### **ListingCard.jsx**
- Displays provider information (image, name, rating, etc.)
- Highlights when selected
- Handles click events
- Responsive card design

#### **SearchBar.jsx**
- Search input for filtering
- Category chips for filtering
- Sticky header on scroll
- Responsive padding

#### **WellnessMap.jsx**
- Google Maps integration
- Custom emerald markers
- Click to highlight/pan
- Auto-fit bounds to listings
- Loading and error states

### ⚙️ Configuration

#### **supabaseClient.js**
- Initializes Supabase client
- Exports for use across components
- Uses environment variables

#### **vite.config.js**
- Vite build configuration
- React plugin setup

#### **tailwind.config.js**
- Tailwind CSS customization
- Emerald color palette
- Content paths

#### **postcss.config.js**
- PostCSS plugins
- Tailwind + Autoprefixer

### 🎨 Styles

#### **index.css**
- Tailwind directives (@tailwind)
- Global styles
- Custom scrollbar
- Google Maps overrides
- Utility classes

## Environment Variables

```
.env (not in git)
├── VITE_SUPABASE_URL           # Supabase project URL
├── VITE_SUPABASE_ANON_KEY      # Supabase anon/public key
└── VITE_GOOGLE_MAPS_API_KEY    # Google Maps JavaScript API key
```

## Dependencies

### Production
- `react` - UI library
- `react-dom` - React DOM renderer
- `@supabase/supabase-js` - Supabase client
- `@react-google-maps/api` - Google Maps React wrapper

### Development
- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - Vite React plugin
- `tailwindcss` - CSS framework
- `postcss` - CSS processor
- `autoprefixer` - CSS autoprefixer

## Scripts

```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Build for production (→ dist/)
npm run preview  # Preview production build
```

## Database Schema

```sql
providers
├── id (BIGSERIAL PRIMARY KEY)
├── name (TEXT NOT NULL)
├── category (TEXT)
├── rating (DECIMAL 2,1)
├── reviewCount (INTEGER)
├── neighborhood (TEXT)
├── city (TEXT)
├── image (TEXT)
├── coordinates (JSONB)
│   ├── lat (number)
│   └── lng (number)
└── created_at (TIMESTAMPTZ)
```

## Build Output

```
dist/
├── index.html                      # Entry HTML
└── assets/
    ├── index-[hash].css           # Bundled CSS
    └── index-[hash].js            # Bundled JS
```

Size: ~437 KB total (gzipped: ~122 KB)

## Git Ignored Files

```
.gitignore includes:
├── node_modules/         # Dependencies
├── dist/                 # Build output
├── .env                  # Environment variables
├── .env.local
└── *.log                 # Log files
```

## Folder Purposes

| Folder | Purpose |
|--------|---------|
| `src/` | All source code |
| `src/pages/` | Page components (routes/views) |
| `src/components/` | Reusable React components |
| `dist/` | Production build output |
| `node_modules/` | npm dependencies |

## Key Files to Edit

For typical development:
1. `src/pages/WellnessMarketplace.jsx` - Marketplace page logic
2. `src/App.jsx` - App wrapper (routing, global state)
3. `src/components/*.jsx` - Component updates
4. `src/index.css` - Styling changes
5. `.env` - Configuration

## Additional Notes

- Frontend folder contains a separate Next.js project (can be removed)
- All components are JSX (not TypeScript)
- Tailwind v3 is used (not v4)
- Google Maps markers use Symbol API
- Supabase handles all data operations
