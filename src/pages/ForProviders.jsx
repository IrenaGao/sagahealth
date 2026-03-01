import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar.controller.jsx';

const BOOKING_LINK = 'https://calendly.com/partners-sagashealths/30min';

const EMPTY_FORM = {
  name: '',
  email: '',
  businessName: '',
  businessWebsite: '',
  notes: '',
};

export default function ForProviders() {
  const navigate = useNavigate();
  const location = useLocation();
  const navLinkClass = (path) =>
    `text-sm transition-colors ${location.pathname === path ? 'font-[750] text-gray-900' : 'font-medium text-gray-600 hover:text-gray-900'}`;
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    const normalizedWebsite = form.businessWebsite && !/^https?:\/\//i.test(form.businessWebsite)
      ? `https://${form.businessWebsite}`
      : form.businessWebsite;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/provider-interest`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, businessWebsite: normalizedWebsite }),
        }
      );
      if (!res.ok) throw new Error('Request failed');
      setStatus('success');
      setForm(EMPTY_FORM);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <Navbar
        onLogoClick={() => navigate('/')}
        rightContent={
          <div className="flex items-center gap-5">
            <button
              className={navLinkClass('/')}
              onClick={() => navigate('/')}
            >
              Marketplace
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
            <button
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              onClick={() => window.open('https://mysagahealth.com', '_blank')}
            >
              Learn More
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Provider?</h1>
          <p className="text-gray-500">
            Interested in listing your business on Saga Health? Fill out the form or book a call directly.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* Left: Form */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Get in touch</h2>
            <p className="text-sm text-gray-500 mb-4">Fill out the form and our team will be in touch.</p>
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 flex-1">
            {status === 'success' ? (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 mb-4">
                  <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Thanks for reaching out!</h2>
                <p className="text-gray-500 mb-6">We've received your info and will be in touch soon.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="px-6 py-2 text-sm text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-colors"
                >
                  Submit another response
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Jane Smith"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="jane@example.com"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    required
                    placeholder="Wellness Studio NYC"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Website</label>
                  <input
                    type="text"
                    name="businessWebsite"
                    value={form.businessWebsite}
                    onChange={handleChange}
                    placeholder="yourwebsite.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us about your business, the services you offer, or any questions you have..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-500">Something went wrong. Please try again or email us at support@mysagahealth.com.</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl shadow-md hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'submitting' ? 'Sending...' : 'Submit'}
                </button>
              </form>
            )}
            </div>
          </div>

          {/* Right: Embedded calendar */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Book a call</h2>
            <p className="text-sm text-gray-500 mb-4">Pick a time that works for you and we'll connect directly.</p>
            <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden flex-1">
              <iframe
                src={BOOKING_LINK}
                title="Book a call with Saga Health"
                width="100%"
                height="100%"
                style={{ minHeight: '640px' }}
                frameBorder="0"
                scrolling="yes"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
