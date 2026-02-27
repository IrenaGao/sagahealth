import StripeCheckoutButton from '../../components/StripeCheckoutButton';

export default function LMNFormView({
  currentStep,
  totalSteps,
  formData,
  serviceType,
  isAnyProvider,
  customBusinessName,
  businessName,
  providerAddress,
  providerTakeRate,

  checkoutAmount,
  isSubmitting,
  submitError,
  conditionOptions,
  stateOptions,
  hsaProviderOptions,
  navigate,
  onInputChange,
  onCheckboxChange,
  onNext,
  onBack,
  onSubmit,
  onPaymentError,
  onCustomBusinessNameChange,
  isStepValid,
}) {
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
              Back to Listing
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Get Your Letter of Medical Necessity
            </h2>
            <p className="text-gray-600">
              Answer a few questions to receive your personalized LMN
            </p>
          </div>

          <form onSubmit={onSubmit}>
            {/* Step 1: Personal Information & Demographics */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information & Demographics</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => onInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => onInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How old are you? *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => onInputChange('age', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What is your sex assigned at birth? *
                  </label>
                  <select
                    required
                    value={formData.sex}
                    onChange={(e) => onInputChange('sex', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Intersex">Intersex</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Pregnancy question - only show if sex is Female */}
                {formData.sex === 'Female' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Are you pregnant?
                    </label>
                    <select
                      value={formData.pregnant}
                      onChange={(e) => onInputChange('pregnant', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Who is your HSA provider? *
                  </label>
                  <select
                    required
                    value={formData.hsaProvider}
                    onChange={(e) => onInputChange('hsaProvider', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select your HSA provider...</option>
                    {hsaProviderOptions.map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What state do you live in? *
                  </label>
                  <select
                    required
                    value={formData.state}
                    onChange={(e) => onInputChange('state', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select your state...</option>
                    {stateOptions.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name} ({state.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Business Name field - only show when coming from "any provider" route */}
                {isAnyProvider && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provider/Business Name *
                    </label>
                    <input
                      type="text"
                      required={isAnyProvider}
                      value={customBusinessName}
                      onChange={(e) => onCustomBusinessNameChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter the name of your wellness provider or business"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Health Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Have you been diagnosed with any of the following conditions? *
                  </label>
                  <p className="text-sm text-gray-600 mb-2">Select at least one condition to continue</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {conditionOptions.map(condition => (
                      <label key={condition} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.diagnosedConditions.includes(condition)}
                          onChange={() => onCheckboxChange('diagnosedConditions', condition)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Do you have a family history of any of the following conditions?
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {conditionOptions.map(condition => (
                      <label key={condition} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.familyHistory.includes(condition)}
                          onChange={() => onCheckboxChange('familyHistory', condition)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Do you have any risk factors?
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {conditionOptions.map(condition => (
                      <label key={condition} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.riskFactors.includes(condition)}
                          onChange={() => onCheckboxChange('riskFactors', condition)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why do you want to prevent these conditions?
                  </label>
                  <textarea
                    value={formData.preventiveTargets}
                    onChange={(e) => onInputChange('preventiveTargets', e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Tell us about your health goals and why you want to prevent these conditions..."
                  />
                </div>
              </div>
            )}

            {/* Step 3: Attestation & Payment */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attestation & Payment</h3>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex gap-3 mb-4">
                    <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-base font-semibold text-blue-900 mb-3">
                        HSA/FSA Eligibility Attestation
                      </h4>
                      <div className="text-sm text-blue-900 space-y-3">
                        <p>
                          I confirm that this purchase is primarily intended to cure, mitigate, treat, or prevent the diagnosed medical condition(s) I have identified in this form.
                        </p>
                        <p>
                          I further confirm that I would not be making this purchase if not for my diagnosed medical condition(s).
                        </p>
                        <p>
                          I understand that Saga Health and its partners rely on the accuracy of the information I provide. If these statements are inaccurate, my purchases may not be eligible for HSA/FSA reimbursement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-300 rounded-xl p-6 bg-gray-50">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={formData.attestation}
                      onChange={(e) => onInputChange('attestation', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      I have read and agree to the attestation above. I certify that all information provided is true and accurate to the best of my knowledge. *
                    </span>
                  </label>
                </div>

                {/* Payment Button */}
                <div className="pt-4">
                  <StripeCheckoutButton
                    amount={checkoutAmount}
                    disabled={!formData.attestation}
                    onError={onPaymentError}

                    serviceName={serviceType}
                    firstHealthCondition={formData.diagnosedConditions?.[0] || null}
                    businessName={isAnyProvider && customBusinessName ? customBusinessName : businessName}
                    businessAddress={providerAddress}
                    takeRate={providerTakeRate}
                    formData={{
                      ...formData,
                      desiredProduct: serviceType,
                      businessName: isAnyProvider && customBusinessName ? customBusinessName : businessName
                    }}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!isStepValid()}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isStepValid()
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <div className="text-sm text-gray-500">
                  Clicking on the Payment button will take you to the Stripe Checkout page.
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-1">Error Submitting Form</h3>
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Your Information is Secure</h3>
              <p className="text-sm text-blue-800">
                All information is encrypted and HIPAA-compliant. Your LMN will be delivered to your email within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
