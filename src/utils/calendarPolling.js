/**
 * Google Calendar Polling - Check for new bookings
 * This approach polls the Calendar API to detect new appointments
 */

export async function pollForNewBooking(accessToken, calendarId, startTime) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
      new URLSearchParams({
        timeMin: startTime.toISOString(),
        maxResults: 10,
        orderBy: 'startTime',
        singleEvents: true
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if there are any new events
    if (data.items && data.items.length > 0) {
      console.log('New booking detected:', data.items[0]);
      return {
        success: true,
        booking: data.items[0]
      };
    }

    return {
      success: false,
      booking: null
    };

  } catch (error) {
    console.error('Error polling calendar:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Start polling for bookings at intervals
 */
export function startBookingPolling(accessToken, calendarId, onBookingDetected, intervalMs = 5000) {
  const startTime = new Date();
  
  const pollInterval = setInterval(async () => {
    const result = await pollForNewBooking(accessToken, calendarId, startTime);
    
    if (result.success) {
      onBookingDetected(result.booking);
      clearInterval(pollInterval);
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(pollInterval);
}


