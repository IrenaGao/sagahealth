# Google Calendar Booking Integration Setup

This guide will help you set up Google Calendar OAuth integration for the booking functionality.

## Prerequisites

- A Google Cloud Platform account
- A project in Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top
3. Click "NEW PROJECT"
4. Enter a project name (e.g., "Saga Health Booking")
5. Click "CREATE"

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on it and press **ENABLE**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type
3. Click **CREATE**
4. Fill in the required fields:
   - **App name**: Saga Health
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **SAVE AND CONTINUE**
6. On the "Scopes" page, click **ADD OR REMOVE SCOPES**
7. Add the following scope:
   - `https://www.googleapis.com/auth/calendar` (full access to Google Calendar)
8. Click **UPDATE** and then **SAVE AND CONTINUE**
9. On "Test users" page (if in testing mode):
   - Click **ADD USERS**
   - Add your Gmail address and any other test users
   - Click **SAVE AND CONTINUE**
10. Review and click **BACK TO DASHBOARD**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **CREATE CREDENTIALS** > **OAuth client ID**
3. Select **Web application** as the application type
4. Enter a name (e.g., "Saga Health Web Client")
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for local development)
   - Your production domain (e.g., `https://yourdomain.com`)
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173` (for local development)
   - Your production domain (e.g., `https://yourdomain.com`)
7. Click **CREATE**
8. Copy your **Client ID** - you'll need this!

## Step 5: Add Environment Variables

1. Open your `.env` file in the project root
2. Add the following variables:

```env
# Google Calendar OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com

# Optional: If you need additional API access
VITE_GOOGLE_CALENDAR_API_KEY=your-api-key-here
```

3. Replace `your-client-id-here` with the Client ID from Step 4
4. Save the file

## Step 6: Restart Development Server

After updating the `.env` file, restart your development server:

```bash
npm run dev
```

## Testing the Integration

1. Navigate to a service in your wellness marketplace
2. Click "Book Now"
3. Click "Sign in with Google"
4. Grant calendar access permissions
5. Select a date and available time slot
6. Click "Confirm Booking"
7. The appointment should appear in your Google Calendar!

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure your redirect URI in Google Cloud Console matches your application URL exactly
- Check that you've added both `http://localhost:5173` and your production URL

### "Access blocked: Authorization Error"
- Ensure your OAuth consent screen is properly configured
- If in testing mode, make sure your Google account is added as a test user
- Check that the Google Calendar API scope is added

### "Failed to authenticate with Google"
- Verify your Client ID is correct in the `.env` file
- Make sure the `.env` file is in the project root
- Restart your development server after changing environment variables

### No available time slots showing
- Check that you've granted calendar permissions
- Verify the selected date is in the future
- Try selecting a different date

### Booking fails to create
- Ensure you have "Make changes to events" permission granted
- Check browser console for specific error messages
- Verify your access token is valid

## Production Deployment

When deploying to production:

1. Update OAuth credentials in Google Cloud Console:
   - Add your production domain to **Authorized JavaScript origins**
   - Add your production domain to **Authorized redirect URIs**

2. Set environment variables on your hosting platform:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GOOGLE_CALENDAR_API_KEY` (if needed)

3. If using OAuth in production:
   - Consider moving to "In production" status in OAuth consent screen
   - This requires verification by Google if you have sensitive scopes
   - For internal use, you can stay in testing mode with specific users

## Security Best Practices

- ⚠️ Never commit your `.env` file to version control
- 🔒 Keep your Client ID and API keys secure
- 🔐 Use environment variables for all sensitive configuration
- 👥 Limit OAuth consent screen to necessary scopes only
- 🔄 Regularly review and rotate credentials if compromised

## Features Implemented

✅ **Google OAuth Login** - Secure authentication with Google  
✅ **Calendar API Integration** - Read user's calendar for availability  
✅ **Free/Busy Time Slots** - Shows available 1-hour slots (9 AM - 5 PM)  
✅ **Event Creation** - Books appointments directly in Google Calendar  
✅ **Automatic Reminders** - Email reminder 24 hours before, popup 30 min before  
✅ **Success Confirmation** - Clear feedback when booking is complete  

## API Rate Limits

- Google Calendar API has a default quota of 1,000,000 queries per day
- Per-user limit: 10 requests per second
- For most applications, these limits are sufficient

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [React OAuth Google Library](https://www.npmjs.com/package/@react-oauth/google)

## Support

If you encounter issues not covered in this guide:
1. Check the browser console for error messages
2. Review the Google Cloud Console audit logs
3. Verify all setup steps were completed correctly
4. Ensure all environment variables are set properly

