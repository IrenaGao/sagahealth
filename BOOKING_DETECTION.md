# Booking Detection Documentation

## Overview

The `EmbeddedBooking.jsx` component includes a booking detection system that attempts to identify when a user completes a booking in the embedded Google Calendar iframe.

## How It Works

### 1. **postMessage Listener** (Primary Method)
The component listens for `postMessage` events from the Google Calendar iframe:

```javascript
window.addEventListener('message', handleMessage);
```

**What it does:**
- Listens for messages from `https://calendar.google.com`
- Checks for booking completion indicators in the message data
- Triggers `onBookingComplete()` callback when booking is detected

**Supported message formats:**
- `{ type: 'booking_complete' }`
- `{ action: 'appointment_booked' }`
- `{ status: 'confirmed' }`

**Limitation:** Google Calendar may not send postMessage events by default. This is implemented for future compatibility.

### 2. **iframe onLoad Handler** (Secondary Method)
Monitors when the iframe loads or reloads:

```javascript
<iframe onLoad={handleIframeLoad} />
```

**What it does:**
- Detects when the iframe content loads
- Attempts to check if the URL contains confirmation keywords
- Logs events for debugging

**Limitation:** Due to CORS (Cross-Origin Resource Sharing) policies, we cannot access the iframe's URL from a different domain. This will typically fail silently.

## The `onBookingComplete()` Callback

When a booking is detected, the callback function is triggered:

```javascript
const onBookingComplete = () => {
  console.log('Booking completed!');
  setBookingCompleted(true);
  
  // Add your custom logic here:
  // - Show success notification ✓
  // - Send data to backend
  // - Track analytics
  // - Redirect user
  
  return true;
};
```

**Returns:** `true` when booking is completed

## Current Features

✅ **Success Notification**: A green banner appears when booking is detected
✅ **Console Logging**: All events are logged for debugging
✅ **Security**: Only accepts messages from Google Calendar domain
✅ **Reference Available**: The iframe can be accessed via `iframeRef.current`

## Limitations

⚠️ **CORS Restrictions**: Cannot directly access iframe content due to browser security
⚠️ **Google Calendar Behavior**: Google Calendar may not send postMessage events
⚠️ **No Direct Confirmation**: Cannot guarantee 100% detection without Google Calendar API integration

## Alternative Solutions

For more reliable booking detection, consider:

### 1. **Google Calendar API Integration**
- Poll the Calendar API for new appointments
- Requires OAuth 2.0 authentication
- Can retrieve actual booking data
- More complex implementation

```javascript
// Example: Poll Google Calendar API
const checkForNewBookings = async () => {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  // Check for new events
};
```

### 2. **Webhook/Redirect URL**
- Configure Google Calendar to redirect after booking
- Set up a confirmation page on your domain
- More reliable but requires Google Calendar configuration

### 3. **Manual Confirmation**
- Add a "I've completed my booking" button
- Simple but requires user action

## Testing the Detection

To test if booking detection is working:

1. Open browser DevTools Console
2. Navigate to the booking page
3. Complete a booking in the calendar
4. Check console for messages:
   - `"Calendar iframe loaded"` - iframe loaded successfully
   - `"Message received from calendar: ..."` - postMessage received
   - `"Booking completed!"` - booking detected
   - `"Cannot access iframe URL (CORS protected)"` - expected CORS error

## Customization

### Adding Custom Actions on Booking

Edit the `onBookingComplete()` function in `EmbeddedBooking.jsx`:

```javascript
const onBookingComplete = () => {
  console.log('Booking completed!');
  setBookingCompleted(true);
  
  // Example: Send to analytics
  if (window.gtag) {
    window.gtag('event', 'booking_complete', {
      service_id: id,
      booking_option: bookingOption.name,
      price: bookingOption.price
    });
  }
  
  // Example: Send to your backend
  fetch('/api/bookings/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceId: id,
      bookingOptionId: bookingOption.id,
      timestamp: new Date().toISOString()
    })
  });
  
  // Example: Show custom notification
  alert('Thank you for booking!');
  
  // Example: Redirect after delay
  setTimeout(() => {
    navigate('/booking-confirmation');
  }, 3000);
  
  return true;
};
```

### Manual Testing Trigger

You can manually trigger the booking complete state for testing:

```javascript
// In browser console:
window.postMessage({ type: 'booking_complete' }, 'https://calendar.google.com');
```

Or add a test button (for development only):

```jsx
{/* Development only - remove in production */}
<button onClick={() => setBookingCompleted(true)}>
  Test Booking Complete
</button>
```

## Security Considerations

- ✅ Only accepts messages from `https://calendar.google.com`
- ✅ Validates message structure before processing
- ✅ No sensitive data exposed to iframe
- ✅ Read-only access to iframe reference

## Future Enhancements

Possible improvements:
1. Integrate Google Calendar API for actual booking verification
2. Add backend webhook to receive booking confirmations
3. Implement retry logic for detection
4. Add user feedback mechanism if detection fails
5. Store booking attempts in local storage
6. Email notification system

## Support

For questions or issues with booking detection:
1. Check browser console for error messages
2. Verify iframe is loading correctly
3. Test with different booking times
4. Check CORS policies in browser DevTools

