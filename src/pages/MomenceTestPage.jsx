import { useNavigate } from 'react-router-dom';

export default function MomenceTestPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Saga Health</h1>
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Momence Test Page</h1>
          <p className="text-gray-600">Testing Momence scheduling integration</p>
        </div>

        {/* Momence Widget - Iframe Version */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <iframe
            src="/momence-embed.html"
            className="w-full h-[800px] border-0"
            title="Momence Booking Widget"
            allow="payment"
          />
        </div>

        {/* Alternative: Direct Script Embed (commented out) */}
        {/* <div 
          id="momence-container" 
          className="bg-white rounded-2xl shadow-lg overflow-hidden min-h-[600px]"
        >
          The script will be injected here by useEffect
        </div> */}
      </div>
    </div>
  );
}

