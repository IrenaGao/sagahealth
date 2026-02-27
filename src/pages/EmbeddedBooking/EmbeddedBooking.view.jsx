export default function EmbeddedBookingView({
  service,
  bookingOption,
  bookingOptions,
  loading,
  error,
  oneBookingLink,
  bookingLink,
  bookingConfirmed,
  showBookingConfirmed,
  formData,
  classOfferings,
  iframeRef,
  businessName,
  navigate,
  onBookingComplete,
  onAppStoreClick,
  onIframeLoad,
  onShowBookingConfirmed,
  onCloseBookingConfirmed,
  onFormDataChange,
  onBookingConfirmSubmit,
}) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading booking...</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error || 'Service not found'}</div>
      </div>
    );
  }

  if (!service?.isApp && !bookingOption) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Booking option not found</div>
      </div>
    );
  }

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
              onClick={() => navigate(`/book/${businessName}`)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Services
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Important Reminder */}
        <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                 ⚠️ <span className="ml-1">
                   {oneBookingLink
                     ? 'Important: Your purchase is NOT confirmed until you click "Confirm booking" at the bottom of this page'
                     : 'Important: Your purchase is NOT confirmed until you click "Get your LMN now" or "Pay for my appointment" at the bottom of this page'
                   }
                 </span>
              </p>
            </div>
          </div>
        </div>

        {/* Service Info */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
          {bookingOption && (
            <div className="flex items-center gap-4 text-gray-600">
              <span className="text-2xl">{bookingOption.icon}</span>
              <span className="text-lg font-medium">{bookingOption.name}</span>
            </div>
          )}
        </div>

        {/* Embedded Calendar or App Store Badge */}
        {service?.widgetType === 'external' ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 flex flex-col items-center justify-center text-center" style={{ minHeight: '300px' }}>
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Book your appointment</h3>
            <p className="text-gray-600 mb-6">Click below to open the booking page for {service.name}.</p>
            <a
              href={bookingOption?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Book Now
            </a>
          </div>
        ) : service?.isApp ? (
          <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: '400px' }}>
            {/* Background image */}
            {service?.appImageUrl && (
              <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${service.appImageUrl})`,
                  filter: 'blur(1.5px)',
                }}
              />
            )}
            {/* Gray overlay */}
            <div className="absolute inset-0 bg-gray-500 bg-opacity-40" />

            {/* Booking confirmation overlay - only show when booking not confirmed and is_app is set */}
            {!bookingConfirmed && service?.isApp && oneBookingLink && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl pt-3 pb-6 px-16">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-blue-900 mt-4 mb-3 text-center">
                        Ready to download?
                      </h3>
                      <p className="text-sm text-blue-800 mb-4 flex-1 text-center">
                        Enter your name and email to get started.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (!bookingConfirmed) {
                          onShowBookingConfirmed();
                        }
                      }}
                      disabled={bookingConfirmed}
                      className={`px-8 py-3 font-semibold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 ${
                        bookingConfirmed
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-lg'
                      }`}
                    >
                      {bookingConfirmed ? (
                        <>
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Booking Confirmed
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Continue
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* App Store badges - only show when booking is confirmed */}
            {bookingConfirmed && (() => {
              const appleService = bookingOptions.find(opt => opt.description === 'apple');
              const googleService = bookingOptions.find(opt => opt.description === 'google');

              if (bookingOptions.length > 1) {
                return (
                  <div className="relative flex flex-col sm:flex-row items-center justify-center h-full min-h-[400px] py-12 z-10 gap-4">
                    {appleService && (
                      <button
                        onClick={(e) => onAppStoreClick(e, appleService.url)}
                        className="inline-block hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-0 p-0 z-10"
                      >
                        <img
                          src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&releaseDate=1276560000"
                          alt="Download on the App Store"
                          className="h-20 w-auto"
                          style={{ height: '80px', width: 'auto' }}
                        />
                      </button>
                    )}
                    {googleService && (
                      <button
                        onClick={(e) => onAppStoreClick(e, googleService.url)}
                        className="inline-block hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-0 p-0 z-10"
                      >
                        <img
                          src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                          alt="Get it on Google Play"
                          className="h-20 w-auto"
                          style={{ height: '115px', width: 'auto' }}
                        />
                      </button>
                    )}
                  </div>
                );
              } else if (bookingOptions.length === 1 && bookingOption) {
                return (
                  <div className="relative flex items-center justify-center h-full min-h-[400px] py-12 z-10">
                    <button
                      onClick={(e) => onAppStoreClick(e, bookingOption.url)}
                      className="inline-block hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-0 p-0 z-10"
                    >
                      <img
                        src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&releaseDate=1276560000"
                        alt="Download on the App Store"
                        className="h-20 w-auto"
                        style={{ height: '80px', width: 'auto' }}
                      />
                    </button>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        ) : bookingOption ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <iframe
              ref={iframeRef}
              {...(service?.widgetType === 'momence' && bookingLink ? {
                srcdoc: bookingOption.url
              } : {
                src: bookingOption.url
              })}
              className="w-full h-[800px] border-0"
              title={`Book ${bookingOption.name}`}
              onLoad={onIframeLoad}
            />
          </div>
        ) : null}

        {/* Payments Section */}
        <div className={`mt-6 ${
          oneBookingLink
            ? ''
            : 'bg-white rounded-2xl shadow-lg p-6'
        }`}>
          <div>
            {oneBookingLink ? (
              <div className={`grid grid-cols-1 ${service?.isApp ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>
                {/* Done booking - Blue subsection - only show if not is_app */}
                {!service?.isApp && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex flex-col h-full">
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-blue-900 mb-3 text-center">
                          Ready to complete your booking?
                        </h3>
                        <p className="text-sm text-blue-800 mb-4 text-center">
                          You'll receive a confirmation email shortly.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (!bookingConfirmed) {
                            onShowBookingConfirmed();
                          }
                        }}
                        disabled={bookingConfirmed}
                        className={`px-8 py-3 font-semibold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 ${
                          bookingConfirmed
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-lg'
                        }`}
                      >
                        {bookingConfirmed ? (
                          <>
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Booking Confirmed
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Confirm booking
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Get your LMN now - Green subsection */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
                  <div className={`flex ${service?.isApp ? 'flex-row items-center gap-12' : 'flex-col h-full'}`}>
                    <div className={service?.isApp ? 'flex-none w-3/5' : 'flex-1'}>
                      <h3 className="text-lg font-bold text-green-900 mb-3">
                        First time booking this service? Get your LMN now!
                      </h3>
                      <p className={`text-sm text-green-800 ${service?.isApp ? 'mb-0' : 'mb-4 flex-1'}`}>
                        Save ~30% on your appointment by unlocking pre-tax HSA/FSA funds. Just take a
                        quick health survey, pay a $20 fee, and get your Letter of Medical Necessity (LMN)
                        in hours.
                      </p>
                    </div>
                    <button
                      onClick={onBookingComplete}
                      className={`${service?.isApp ? 'px-12 py-3 flex-1' : 'px-8 py-3'} bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Get your LMN now
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ready to complete your booking - Blue subsection */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-lg font-bold text-blue-900 mb-3 text-center">
                        Ready to complete your booking?
                      </h3>
                      <p className="text-sm text-blue-800 mb-4 text-center">
                        You'll receive a confirmation email shortly.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (!bookingConfirmed) {
                          onShowBookingConfirmed();
                        }
                      }}
                      disabled={bookingConfirmed}
                      className={`px-8 py-3 font-semibold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 ${
                        bookingConfirmed
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-lg'
                      }`}
                    >
                      {bookingConfirmed ? (
                        <>
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Booking Confirmed
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Confirm booking
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* First time booking - Green subsection */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-green-900 mb-3">
                        First time booking this service? Get your LMN now!
                      </h3>
                      <p className="text-sm text-green-800 mb-4 flex-1">
                        Save ~30% on your appointment by unlocking pre-tax HSA/FSA funds. Just take a
                        quick health survey, pay a $20 fee, and get your Letter of Medical Necessity (LMN)
                        in hours. You can also pay for your appointment here!
                      </p>
                    </div>
                    <button
                      onClick={onBookingComplete}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Get your LMN now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Confirmed Form Popup */}
      {showBookingConfirmed && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onCloseBookingConfirmed}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all relative">
              <button
                onClick={onCloseBookingConfirmed}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div>
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-600 mb-4">Please provide your details to complete the booking.</p>
                </div>
                <form onSubmit={onBookingConfirmSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => onFormDataChange({ firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => onFormDataChange({ lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-gray-500 text-xs">(optional)</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => onFormDataChange({ email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label htmlFor="classPackage" className="block text-sm font-medium text-gray-700 mb-2">
                      Class or Package Selected <span className="text-gray-500 text-xs">(optional)</span>
                    </label>
                    {classOfferings.length > 0 ? (
                      <select
                        id="classPackage"
                        value={formData.classPackage}
                        onChange={(e) => onFormDataChange({ classPackage: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                      >
                        <option value="" style={{ color: '#6b7280' }}>Select a class or package...</option>
                        {classOfferings.map((offering) => (
                          <option key={offering.id} value={offering.class_or_package_name}>
                            {offering.class_or_package_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        id="classPackage"
                        value={formData.classPackage}
                        onChange={(e) => onFormDataChange({ classPackage: e.target.value })}
                        placeholder="Enter class or package name..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                      />
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
