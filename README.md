# 🏥 Saga Health - Wellness Marketplace

A beautiful, modern wellness marketplace built with React, Vite, Tailwind CSS, Supabase, and Google Maps API.

## ✨ Features

- **🗺️ Interactive Google Maps** - Custom emerald markers with smooth pan/zoom
- **🔍 Real-time Search & Filter** - Search by name, location, or category
- **💾 Supabase Backend** - Real-time database with PostgreSQL
- **📱 Fully Responsive** - Mobile-first design with toggle views
- **🎨 Modern UI** - Light emerald theme with smooth animations
- **⚡ Lightning Fast** - Built with Vite for instant HMR

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Supabase account ([sign up free](https://supabase.com))
- Google Maps API key ([get one free](https://console.cloud.google.com))

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env

# Edit .env and add your credentials:
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-supabase-anon-key  
# VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# 3. Run the development server
npm run dev

# 4. Open http://localhost:5173
```

## 📊 Database Setup

### Your `providers` table schema:

```sql
-- Your current schema
CREATE TABLE providers (
  id BIGSERIAL PRIMARY KEY,
  business_name TEXT NOT NULL,
  business_type TEXT,
  short_summary TEXT,
  booking_link TEXT,
  rating DECIMAL(2,1),
  num_reviews INTEGER,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access
CREATE POLICY "Enable read access for all users" ON providers
  FOR SELECT
  USING (true);
```

### Field Mapping (Database → Frontend):
- `business_name` → displayed as business name (header)
- `business_type` → category chip and filtering
- `short_summary` → description text (2 lines max)
- `booking_link` → "Book Now" button
- `rating` → star rating (e.g., ★ 4.8)
- `num_reviews` → review count (e.g., "23 reviews")
- `address` → location displayed with rating (e.g., "123 Main St, New York, NY")

### Add sample data:

```sql
INSERT INTO providers (business_name, business_type, short_summary, booking_link, rating, num_reviews, address)
VALUES 
  ('Green Valley Yoga Studio', 'Yoga', 'Peaceful yoga classes for all levels', 'https://example.com/book/yoga', 4.9, 342, '123 West 4th St, New York, NY'),
  ('Zenith Fitness Club', 'Gym', 'State-of-the-art fitness equipment and trainers', 'https://example.com/book/gym', 4.7, 856, '456 8th Ave, New York, NY'),
  ('Serenity Massage Therapy', 'Massage', 'Relaxing therapeutic massage services', 'https://example.com/book/massage', 4.8, 523, '789 Broadway, New York, NY');
```

## 🗺️ Google Maps Setup

See [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) for detailed instructions.

**Quick steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps JavaScript API
3. Create an API key
4. Add to `.env` as `VITE_GOOGLE_MAPS_API_KEY`

**Free tier:** $200/month credit = 28,500+ free map loads

## 📁 Project Structure

```
sagahealth/
├── src/
│   ├── components/
│   │   ├── ListingCard.jsx      # Provider card component
│   │   ├── SearchBar.jsx         # Search + category filters
│   │   └── WellnessMap.jsx       # Google Maps integration
│   ├── App.jsx                   # Main application
│   ├── main.jsx                  # Entry point
│   ├── index.css                 # Tailwind + global styles
│   └── supabaseClient.js         # Supabase configuration
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

## 🎨 Tech Stack

- **Frontend:** React 18 + Vite 5
- **Styling:** Tailwind CSS v3
- **Database:** Supabase (PostgreSQL)
- **Maps:** Google Maps JavaScript API
- **Deployment:** Vercel / Netlify ready

## 🔧 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🎯 Features in Detail

### Interactive Map
- Custom emerald circular markers
- Click card → map pans to location
- Click marker → card scrolls into view
- Auto-fit bounds to show all listings
- Bounce animation on highlight

### Smart Search & Filtering
- Real-time search by name, neighborhood, or city
- Category chips: All, Gym, Massage, Pilates, Yoga, Spa, Meditation
- Instant client-side filtering
- Live result count

### Responsive Design
- **Desktop:** 50/50 split view (list | map)
- **Mobile:** Toggle between list and map
- Responsive padding that scales with screen size
- Touch-friendly interactions

### Supabase Integration
- Real-time data fetching
- Row Level Security (RLS) policies
- PostgreSQL with JSONB for coordinates
- Automatic connection management

## 📱 Responsive Breakpoints

| Screen Size | Padding | Layout |
|-------------|---------|--------|
| Mobile (<640px) | 16px | Stacked |
| Small (640-767px) | 24px | Stacked |
| Medium (768-1023px) | 40px | Stacked |
| Large (1024-1279px) | 64px | Split 50/50 |
| XL (1280px+) | 96px | Split 50/50 |

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy the `dist` folder
```

### Environment Variables
Make sure to add your environment variables in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`

## 🔒 Security Notes

- Never commit `.env` file to Git
- Use Row Level Security (RLS) in Supabase
- Restrict Google Maps API key to your domain
- Set up billing alerts in Google Cloud

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) - Maps API setup
- [FEATURES.md](FEATURES.md) - Detailed feature breakdown

## 🐛 Troubleshooting

### Map doesn't load
- Check your Google Maps API key in `.env`
- Ensure Maps JavaScript API is enabled in Google Cloud
- Restart dev server after changing `.env`

### No data showing
- Verify Supabase connection in `.env`
- Check RLS policies allow SELECT
- Ensure `providers` table exists and has data

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Clear cache: `rm -rf node_modules dist && npm install`

## 📄 License

MIT

## 🙏 Credits

- Maps: [Google Maps Platform](https://developers.google.com/maps)
- Database: [Supabase](https://supabase.com)
- Images: [Unsplash](https://unsplash.com)
- Icons: Unicode Emojis

---

**Built with ❤️ using React, Vite, Tailwind CSS, Supabase, and Google Maps**
