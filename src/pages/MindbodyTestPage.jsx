import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function MindbodyTestPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Load the Healcode script
    const script = document.createElement('script');
    script.src = 'https://widgets.mindbodyonline.com/javascripts/healcode.js';
    script.type = 'text/javascript';
    
    document.head.appendChild(script);

    // Cleanup: remove script when component unmounts
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mindbody/Healcode Test Page</h1>
          <p className="text-gray-600">Testing Mindbody scheduling integration</p>
        </div>

        {/* Service Info */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">
            <strong>PILATES REFORMED I</strong>
          </h2>
          <p className="text-gray-700">410 Marcus Garvey BLVD</p>
          <p className="text-gray-600">(Pilates Reformed: Open Level & Fundamentals)</p>
        </div>

        {/* Healcode Widget Container */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6">
          <healcode-widget 
            data-type="schedules" 
            data-widget-partner="object" 
            data-widget-id="3b2076204a41" 
            data-widget-version="1"
          ></healcode-widget>
        </div>
      </div>
    </div>
  );
}

