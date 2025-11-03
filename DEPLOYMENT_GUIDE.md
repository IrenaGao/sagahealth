# Saga Health Deployment Guide

## Quick Start

### Backend Deployment (Render - Recommended)

1. **Sign up at [render.com](https://render.com)**

2. **Create a New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `saga-health-api`
     - **Environment**: `Node`
     - **Build Command**: `npm install --legacy-peer-deps`
     - **Start Command**: `npm start`
     - **Port**: `3001` (or leave auto-detect)

3. **Add Environment Variables:**
   ```
   STRIPE_SECRET_KEY=sk_live_your_secret_key
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
   ANTHROPIC_API_KEY=your_anthropic_key
   SIGNWELL_API_KEY=your_signwell_key
   PINECONE_API_KEY=your_pinecone_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   PORT=3001
   ```

4. **Deploy** - Render will automatically deploy your backend

5. **Note your backend URL**: `https://saga-health-api.onrender.com`

---

### Frontend Deployment (Vercel - Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Create `.env.production` file:**
   ```
   VITE_API_URL=https://saga-health-api.onrender.com
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

5. **Or deploy via Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Environment Variables**: Add `VITE_API_URL` and `VITE_STRIPE_PUBLISHABLE_KEY`

---

## Alternative Deployment Options

### Backend Alternatives

#### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set STRIPE_SECRET_KEY=your_key

# Deploy
railway up
```

#### Heroku
```bash
# Install Heroku CLI
heroku login
heroku create saga-health-api

# Add environment variables
heroku config:set STRIPE_SECRET_KEY=your_key
heroku config:set ANTHROPIC_API_KEY=your_key

# Deploy
git push heroku main
```

### Frontend Alternatives

#### Netlify
1. Go to [netlify.com](https://netlify.com)
2. "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add environment variables in Site Settings → Environment Variables

#### GitHub Pages (Static hosting)
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "predeploy": "npm run build",
# "deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

---

## Pre-Deployment Checklist

### Backend
- [ ] All environment variables are set
- [ ] Stripe keys are using LIVE keys (not test keys)
- [ ] CORS is configured for your frontend domain
- [ ] Database connections are working
- [ ] API endpoints are tested

### Frontend
- [ ] `VITE_API_URL` points to production backend
- [ ] Stripe publishable key is LIVE key
- [ ] All API calls use environment variable for base URL
- [ ] Build completes without errors: `npm run build`
- [ ] Test the production build locally: `npm run preview`

---

## CORS Configuration

Update your backend `server/api.ts` to allow your frontend domain:

```javascript
// Update CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173', // Local development
    'https://your-frontend-domain.vercel.app' // Production
  ],
  credentials: true
}));
```

---

## Environment Variables Summary

### Backend (.env)
```
PORT=3001
STRIPE_SECRET_KEY=sk_live_...
ANTHROPIC_API_KEY=...
SIGNWELL_API_KEY=...
PINECONE_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### Frontend (Vercel/Netlify Environment Variables)
```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Post-Deployment

1. **Test payment flow** with Stripe test cards
2. **Verify LMN generation** works end-to-end
3. **Check email delivery** (SignWell integration)
4. **Monitor logs** for errors
5. **Set up monitoring** (e.g., Sentry, LogRocket)

---

## Troubleshooting

### "Failed to fetch" errors
- Check that `VITE_API_URL` is set correctly
- Verify CORS is configured on backend
- Check browser console for exact error

### Stripe errors
- Verify you're using LIVE keys in production
- Check Stripe dashboard for webhook events
- Ensure connected account is properly set up

### Build errors
- Run `npm run build` locally first
- Check all dependencies are in `package.json`
- Verify Node version matches deployment platform

---

## Monitoring & Maintenance

### Recommended Tools
- **Error Tracking**: Sentry
- **Analytics**: Google Analytics or Plausible
- **Uptime Monitoring**: UptimeRobot or Pingdom
- **Performance**: Vercel Analytics (built-in)

### Regular Checks
- Monitor Stripe payment success rate
- Check SignWell document delivery
- Review API error logs
- Monitor database usage

---

## Scaling Considerations

As your app grows, consider:
- **CDN**: Cloudflare for static assets
- **Database**: Managed PostgreSQL (Supabase is already managed)
- **Caching**: Redis for API responses
- **Background Jobs**: Queue system for LMN generation
- **Load Balancing**: Multiple backend instances

---

## Support

For deployment issues:
- Render: [render.com/docs](https://render.com/docs)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Stripe: [stripe.com/docs](https://stripe.com/docs)


