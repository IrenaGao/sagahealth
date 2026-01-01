export default function AmeliaTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <iframe
            srcdoc={`
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Amelia Booking Widget</title>
                <script type="module" crossorigin="anonymous" src="https://www.9amazingstars.com/wp-content/plugins/ameliabooking/v3/public/assets/public.d17a4091.js?ver=8.5"></script>
              </head>
              <body style="margin: 0; padding: 20px;">
                <div id="amelia-v2-booking-1000" class="amelia-v2-booking">
                  <step-form-wrapper></step-form-wrapper>
                </div>
              </body>
              </html>
            `}
            className="w-full h-[800px] border-0"
            title="Amelia Booking Widget"
          />
        </div>
      </div>
    </div>
  );
}

