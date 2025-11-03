# CORS Limitations & Alternative Solutions

## Why You Can't Bypass CORS

**CORS (Cross-Origin Resource Sharing)** is a fundamental browser security feature that prevents malicious websites from accessing content from other domains. 

### Why This Error Occurs
```
Cannot access iframe URL (CORS protected)
```

When your website (e.g., `localhost:5173` or `yourdomain.com`) tries to access content from Google Calendar (`calendar.google.com`), the browser blocks this for security reasons.

### Why You CANNOT Bypass It

❌ **Client-side bypass is impossible** - This would be a major security vulnerability
❌ **Browser extensions won't help** - Only affects the user's browser, not production
❌ **Proxy servers won't work** - The iframe runs in the browser, not on your server
❌ **`Access-Control-Allow-Origin` headers** - Only Google can set these for their domain

**Bottom line:** If bypassing CORS was possible, malicious websites could steal data from any site, including your bank account, email, etc.

---

## ✅ Alternative Solutions

### **Option 1: Manual Confirmation Button** ⭐ IMPLEMENTED

**Status:** ✅ Already added to your booking page

**How it works:**
- User completes booking in Google Calendar
- User clicks "I've Completed My Booking" button
- Your app triggers `onBookingComplete()` callback

**Pros:**
- ✅ Simple and reliable
- ✅ No API keys needed
- ✅ Works immediately
- ✅ No CORS issues

**Cons:**
- ❌ Requires user action
- ❌ Users might forget to click

**Code:**
```jsx
<button onClick={onBookingComplete}>
  I've Completed My Booking
</button>
```

---

### **Option 2: Google Calendar API Polling** ⭐ RECOMMENDED

**Status:** 📝 Utility file created (`src/utils/calendarPolling.js`)

**How it works:**
1. User starts booking process
2. Your app polls Google Calendar API every 5 seconds
3. When a new appointment appears, trigger `onBookingComplete()`
4. Stop polling

**Pros:**
- ✅ Automatic detection
- ✅ Reliable
- ✅ Can get booking details
- ✅ No user action needed

**Cons:**
- ❌ Requires Google OAuth setup
- ❌ Needs API key
- ❌ More complex implementation
- ❌ API quota limits

**Implementation Steps:**

1. **Set up Google OAuth** (if not already done)
   - Get credentials from Google Cloud Console
   - Add Calendar API scope: `https://www.googleapis.com/auth/calendar.readonly`

2. **Install dependencies:**
   ```bash
   npm install @react-oauth/google
   ```

3. **Use the polling utility:**
   ```javascript
   import { startBookingPolling } from '../utils/calendarPolling';

   // In your component
   useEffect(() => {
     if (accessToken && calendarId) {
       const cleanup = startBookingPolling(
         accessToken,
         calendarId,
         (booking) => {
           console.log('New booking:', booking);
           onBookingComplete();
         },
         5000 // Poll every 5 seconds
       );

       return cleanup; // Stop polling when component unmounts
     }
   }, [accessToken, calendarId]);
   ```

4. **Complete example in EmbeddedBooking.jsx:**
   ```javascript
   import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
   import { startBookingPolling } from '../utils/calendarPolling';

   function EmbeddedBooking() {
     const [accessToken, setAccessToken] = useState(null);

     // Initialize Google OAuth
     const login = useGoogleLogin({
       onSuccess: (tokenResponse) => {
         setAccessToken(tokenResponse.access_token);
       },
       scope: 'https://www.googleapis.com/auth/calendar.readonly'
     });

     // Start polling when token is available
     useEffect(() => {
       if (accessToken) {
         const cleanup = startBookingPolling(
           accessToken,
           'primary', // or your calendar ID
           (booking) => {
             onBookingComplete();
           }
         );
         return cleanup;
       }
     }, [accessToken]);

     // Rest of component...
   }
   ```

---

### **Option 3: Webhook Notifications**

**How it works:**
1. Set up a server endpoint (e.g., `/api/booking-webhook`)
2. Configure Google Calendar to send notifications to your server
3. Server forwards notification to your frontend via WebSocket/SSE

**Pros:**
- ✅ Real-time notifications
- ✅ Most reliable
- ✅ No polling needed
- ✅ Can capture full booking details

**Cons:**
- ❌ Requires server setup
- ❌ Complex implementation
- ❌ Needs Google Calendar API setup
- ❌ Requires WebSocket/SSE infrastructure

**Server Setup (Express.js example):**
```javascript
// server.js
app.post('/api/booking-webhook', (req, res) => {
  const bookingData = req.body;
  
  // Verify it's from Google
  if (verifyGoogleWebhook(req)) {
    // Notify frontend via WebSocket
    io.emit('booking-completed', bookingData);
  }
  
  res.sendStatus(200);
});
```

**Frontend:**
```javascript
// Connect to WebSocket
const socket = io('your-server-url');

socket.on('booking-completed', (data) => {
  onBookingComplete();
});
```

---

### **Option 4: Redirect URL Parameter**

**How it works:**
1. Google Calendar redirects to your URL after booking
2. Parse URL parameters to detect success
3. Trigger confirmation

**Pros:**
- ✅ Reliable
- ✅ No polling needed
- ✅ Simple implementation

**Cons:**
- ❌ Leaves embedded view
- ❌ May not work with all Calendar setups
- ❌ User experience interrupted

**Note:** Google Calendar Appointment Schedules may not support custom redirect URLs.

---

### **Option 5: Server-Side Proxy** ❌ Won't Work

**Why it doesn't work for this case:**
- The iframe runs in the browser, not on your server
- CORS protection happens in the user's browser
- A proxy would need to render the calendar server-side (not practical)

---

## 📊 Comparison Table

| Solution | Complexity | Reliability | User Action | Setup Time |
|----------|-----------|-------------|-------------|------------|
| Manual Button | ⭐ Low | ⭐⭐⭐ High | Required | 5 min |
| Calendar API Polling | ⭐⭐⭐ High | ⭐⭐⭐⭐⭐ Very High | None | 2-3 hours |
| Webhooks | ⭐⭐⭐⭐⭐ Very High | ⭐⭐⭐⭐⭐ Very High | None | 4-6 hours |
| Redirect URL | ⭐⭐ Medium | ⭐⭐⭐⭐ High | None | 1 hour |

---

## 🎯 Recommended Approach

**For your use case, I recommend:**

### **Short-term:** Use Manual Confirmation Button ✅
- Already implemented
- Works immediately
- Good user experience with clear call-to-action

### **Long-term:** Implement Calendar API Polling
- Automatic detection
- Better user experience
- Can integrate with your backend for analytics

---

## 🚀 Next Steps

### To implement Calendar API Polling:

1. **Enable Google Calendar API**
   ```
   Go to Google Cloud Console > APIs & Services > Enable APIs
   Search for "Google Calendar API" > Enable
   ```

2. **Add OAuth Scopes**
   ```javascript
   // In your OAuth configuration
   scope: 'https://www.googleapis.com/auth/calendar.readonly'
   ```

3. **Install dependencies**
   ```bash
   npm install @react-oauth/google
   ```

4. **Use the polling utility** (already created at `src/utils/calendarPolling.js`)

5. **Test the implementation**
   - Make a test booking
   - Verify polling detects it
   - Confirm `onBookingComplete()` is called

---

## 🔒 Security Considerations

### ✅ Good Practices:
- Never store access tokens in localStorage (use secure httpOnly cookies)
- Always verify webhook signatures
- Use HTTPS for all API calls
- Implement rate limiting for polling
- Set appropriate OAuth scopes (read-only when possible)

### ❌ Don't:
- Try to bypass CORS (it's impossible and dangerous)
- Store sensitive tokens in the frontend
- Make excessive API calls (respect quotas)
- Hardcode API keys in frontend code

---

## 📚 Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [React OAuth Library](https://www.npmjs.com/package/@react-oauth/google)

---

## 💡 Alternative: Email Confirmation Detection

Another approach (not real-time):
1. Google Calendar sends confirmation email
2. User forwards to your system
3. Parse email to confirm booking

**Pros:** Works with any calendar system
**Cons:** Requires user action, not real-time


