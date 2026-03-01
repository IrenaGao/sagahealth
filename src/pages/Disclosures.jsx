import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar.controller.jsx';

const DOCS = [
  {
    id: 'terms',
    label: 'Terms of Service',
    src: '/docs/terms-of-service.pdf',
  },
  {
    id: 'privacy',
    label: 'Privacy Policy',
    src: '/docs/privacy-policy.pdf',
  },
  {
    id: 'dpa',
    label: 'Data Processing Agreement',
    src: '/docs/data-processing-agreement.pdf',
  },
];

export default function Disclosures() {
  const navigate = useNavigate();
  const location = useLocation();
  const navLinkClass = (path) =>
    `text-sm transition-colors ${location.pathname === path ? 'font-[750] text-gray-900' : 'font-medium text-gray-600 hover:text-gray-900'}`;
  const [activeDoc, setActiveDoc] = useState(DOCS[0].id);

  const current = DOCS.find((d) => d.id === activeDoc);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <Navbar
        onLogoClick={() => navigate('/')}
        rightContent={
          <div className="flex items-center gap-6">
            <button
              className={navLinkClass('/')}
              onClick={() => navigate('/')}
            >
              Marketplace
            </button>
            <button
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              onClick={() => window.open('https://mysagahealth.com', '_blank')}
            >
              Learn More
            </button>
            <button
              className={navLinkClass('/new-provider')}
              onClick={() => navigate('/new-provider')}
            >
              New Provider?
            </button>
            <button
              className={navLinkClass('/disclosures')}
              onClick={() => navigate('/disclosures')}
            >
              Disclosures
            </button>
          </div>
        }
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Disclosures</h1>

        {/* Tab bar */}
        <div className="flex gap-1 sm:gap-2 mb-6 border-b border-gray-200 overflow-x-auto hide-scrollbar">
          {DOCS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex-shrink-0
                ${activeDoc === doc.id
                  ? 'bg-white border border-b-white border-gray-200 text-emerald-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              {doc.label}
            </button>
          ))}
        </div>

        {/* PDF viewer */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">{current.label}</span>
            <a
              href={current.src}
              download
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Download PDF
            </a>
          </div>
          <iframe
            key={current.src}
            src={current.src}
            title={current.label}
            className="w-full"
            style={{ height: '75vh' }}
          />
        </div>
      </div>
    </div>
  );
}
