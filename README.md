# 🏥 Saga Health - Wellness Marketplace

A beautiful, modern wellness marketplace built with React, Vite, Tailwind CSS, Supabase, and Google Maps API.

## ✨ Features

- **📅 Google Calendar Booking** - OAuth integration with real-time availability
- **🗺️ Interactive Google Maps** - Custom emerald markers with smooth pan/zoom
- **🔍 Real-time Search & Filter** - Search by name, location, or category
- **💾 Supabase Backend** - Real-time database with PostgreSQL
- **📱 Fully Responsive** - Mobile-first design with toggle views
- **🎨 Modern UI** - Light emerald theme with smooth animations
- **⚡ Lightning Fast** - Built with Vite for instant HMR
- **📋 LMN Generation** - AI-powered Letter of Medical Necessity using Claude

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Supabase account ([sign up free](https://supabase.com))
- Google Maps API key ([get one free](https://console.cloud.google.com))
- Google OAuth Client ID for booking ([setup guide](GOOGLE_CALENDAR_SETUP.md))
- Anthropic API key for LMN generation ([get one here](https://console.anthropic.com))
- Pinecone API key for medical documentation search ([get one here](https://www.pinecone.io))

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
# VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id (for booking)
# ANTHROPIC_API_KEY=your-anthropic-api-key (for LMN generation)
# PINECONE_API_KEY=your-pinecone-api-key (for medical search)
# PINECONE_INDEX=your-pinecone-index-name

# 3. Run the development server (frontend)
npm run dev

# 4. In a separate terminal, run the API server (for LMN generation)
npm run server

# 5. Open http://localhost:5173 (frontend) and http://localhost:3001 (API)
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

## 📅 Google Calendar Booking Setup

See [GOOGLE_CALENDAR_SETUP.md](GOOGLE_CALENDAR_SETUP.md) for detailed instructions.

**Quick steps:**
1. Enable Google Calendar API in Google Cloud Console
2. Configure OAuth consent screen
3. Create OAuth 2.0 Client ID
4. Add to `.env` as `VITE_GOOGLE_CLIENT_ID`

**Features:**
- Real-time availability checking
- 1-hour time slots (9 AM - 5 PM)
- Automatic calendar event creation
- Email and popup reminders

## 📁 Project Structure

```
sagahealth/
├── src/
│   ├── components/
│   │   ├── ListingCard.jsx      # Provider card component
│   │   ├── SearchBar.jsx         # Search + category filters
│   │   └── WellnessMap.jsx       # Google Maps integration
│   ├── pages/
│   │   ├── WellnessMarketplace.jsx # Main marketplace page
│   │   ├── ServiceDetails.jsx   # Service details page
│   │   ├── BookingPage.jsx       # Google Calendar booking page
│   │   ├── EmbeddedBooking.jsx   # Embedded booking widget
│   │   └── LMNForm.jsx           # Letter of Medical Necessity form
│   ├── utils/
│   │   └── calendarPolling.js    # Calendar availability polling
│   ├── App.jsx                   # Main application + routing
│   ├── main.jsx                  # Entry point
│   ├── index.css                 # Tailwind + global styles
│   └── supabaseClient.js         # Supabase configuration
├── server/
│   ├── api.ts                    # Express API server for LMN generation
│   ├── lmn-generator.ts          # Claude AI agent for LMN generation
│   ├── tools/
│   │   └── search-tool.ts        # Pinecone medical documentation search
│   ├── scripts/
│   │   └── ingest_docs.ts        # Script to ingest ICD-10 codes
│   └── support_docs/
│       └── icd10-codes.json      # ICD-10 medical codes database
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── GOOGLE_CALENDAR_SETUP.md      # Booking setup guide
├── BOOKING_DETECTION.md          # Booking detection documentation
├── CORS_ALTERNATIVES.md          # CORS workaround documentation
└── README.md
```

## 🎨 Tech Stack

- **Frontend:** React 18 + Vite 5
- **Backend:** Express.js + TypeScript
- **AI:** Claude (Anthropic) via LangChain
- **Vector DB:** Pinecone for medical documentation search
- **Styling:** Tailwind CSS v3
- **Database:** Supabase (PostgreSQL)
- **Maps:** Google Maps JavaScript API
- **Booking:** Google Calendar API + OAuth 2.0
- **Routing:** React Router v6
- **Deployment:** Vercel / Netlify ready

## 🔧 Available Scripts

```bash
npm run dev      # Start development server (frontend)
npm run server   # Start API server (backend for LMN generation)
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🎯 Features in Detail

### LMN Generation
- **AI-Powered** - Uses Claude (Anthropic) to generate professional medical documentation
- **Medical Search** - Searches ICD-10 codes and medical conditions via Pinecone vector database
- **Multi-Step Form** - Collects patient information, demographics, health history, and attestation
- **HSA/FSA Compliance** - Generates letters for HSA/FSA reimbursement eligibility
- **Clinical Tone** - Professional, evidence-based documentation with PMID citations
- **State Dropdown** - Easy selection from all 50 US states + Washington D.C.

### Google Calendar Booking
- **OAuth Authentication** - Secure sign-in with Google
- **Real-time Availability** - Fetches user's calendar free/busy times
- **Smart Scheduling** - 1-hour slots from 9 AM to 5 PM
- **Auto Reminders** - Email (24hr) and popup (30min) notifications
- **Success Confirmation** - Clear feedback with calendar link

### Interactive Map
- Custom emerald circular markers
- Click card → map pans to location
- Click marker → card scrolls into view
- Auto-fit bounds to show all listings
- Smooth pan transitions

### Smart Search & Filtering
- Real-time search by name, location, or category
- Category chips: All, Gym, Massage, Pilates, Yoga, Spa, Meditation
- Multiple category tags per service
- Instant client-side filtering
- Live result count

### Service Details
- Beautiful detail pages for each service
- Full description and location info
- Rating and review display
- Direct booking integration

### Responsive Design
- **Desktop:** 60/40 split view (list | map)
- **Mobile:** Toggle between list and map
- Responsive padding that scales with screen size
- Touch-friendly interactions

### Supabase Integration
- Real-time data fetching
- Row Level Security (RLS) policies
- PostgreSQL database
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
- `VITE_GOOGLE_CLIENT_ID` (for booking functionality)

## 🔒 Security Notes

- Never commit `.env` file to Git
- Use Row Level Security (RLS) in Supabase
- Restrict Google Maps API key to your domain
- Set up billing alerts in Google Cloud

## 📚 Documentation

- [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) - Maps API setup
- [GOOGLE_CALENDAR_SETUP.md](GOOGLE_CALENDAR_SETUP.md) - Booking setup guide
- [BOOKING_FEATURE.md](BOOKING_FEATURE.md) - Booking feature documentation

## 🐛 Troubleshooting

### Map doesn't load
- Check your Google Maps API key in `.env`
- Ensure Maps JavaScript API is enabled in Google Cloud
- Restart dev server after changing `.env`

### No data showing
- Verify Supabase connection in `.env`
- Check RLS policies allow SELECT
- Ensure `providers` table exists and has data

### Booking not working
- Check `VITE_GOOGLE_CLIENT_ID` is set in `.env`
- Verify OAuth consent screen is configured
- Ensure test users are added (if in testing mode)
- See [GOOGLE_CALENDAR_SETUP.md](GOOGLE_CALENDAR_SETUP.md)

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
