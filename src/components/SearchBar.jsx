import { useState } from 'react';

const categories = ['All', 'Gym', 'Massage', 'Yoga'];

export default function SearchBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedBookableFilter,
  onBookableFilterChange,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleCloseSidebar = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsSidebarOpen(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 pt-6 pb-4">
        {/* Logo and Search Input Row */}
        <div className="flex items-center gap-3 md:gap-8 mb-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold text-gray-900">Saga Health</h1>
          </div>
          
          {/* Search Input */}
          <div className="flex-1 sm:w-96 md:w-[500px] lg:w-[600px]">
            <input
              type="text"
              placeholder="Search wellness services, locations..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Link to Main Site - Desktop only */}
          <a
            href="https://mysagahealth.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex flex-shrink-0 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Learn More
          </a>

          {/* Mobile Filter Menu */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden flex-shrink-0 p-2 text-gray-700 hover:text-emerald-600 transition-colors"
            aria-label="Open filters menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              <circle cx="8" cy="6" r="2" fill="currentColor" />
              <circle cx="16" cy="12" r="2" fill="currentColor" />
              <circle cx="10" cy="18" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* Learn More Button - Mobile only */}
        <a
          href="https://mysagahealth.com"
          target="_blank"
          rel="noopener noreferrer"
          className="md:hidden block w-full px-4 py-2.5 mb-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors text-center"
        >
          Learn More
        </a>
        
        {/* Category Chips - Desktop only */}
        <div className="hidden md:flex gap-2 overflow-x-auto pb-1 hide-scrollbar ml-[56px] sm:ml-[174px] md:ml-[186px]">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
          
          {/* Visual Separator */}
          <div className="h-8 w-px bg-gray-300 mx-3"></div>
          
          {/* Bookable Filter Buttons */}
          <button
            onClick={() => onBookableFilterChange(selectedBookableFilter === 'Bookable' ? 'All' : 'Bookable')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              selectedBookableFilter === 'Bookable'
                ? 'bg-yellow-400 text-yellow-900 shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bookable
          </button>
          
          <button
            onClick={() => onBookableFilterChange(selectedBookableFilter === 'LMN Only' ? 'All' : 'LMN Only')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              selectedBookableFilter === 'LMN Only'
                ? 'bg-gray-400 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            LMN Only
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ease-in-out ${
              isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
            }`}
            onClick={handleCloseSidebar}
          ></div>

          {/* Sidebar Panel */}
          <div className={`fixed top-0 right-0 h-full w-56 bg-white shadow-xl z-50 md:hidden overflow-y-auto transform transition-transform duration-300 ease-in-out ${
            isClosing ? 'animate-slideOutRight' : 'animate-slideInRight'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              <button
                onClick={handleCloseSidebar}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Categories Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        onCategoryChange(category);
                        handleCloseSidebar();
                      }}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                        selectedCategory === category
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Booking Filters Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Booking Options</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onBookableFilterChange(selectedBookableFilter === 'Bookable' ? 'All' : 'Bookable');
                      handleCloseSidebar();
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                      selectedBookableFilter === 'Bookable'
                        ? 'bg-yellow-400 text-yellow-900 shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Bookable
                  </button>
                  
                  <button
                    onClick={() => {
                      onBookableFilterChange(selectedBookableFilter === 'LMN Only' ? 'All' : 'LMN Only');
                      handleCloseSidebar();
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                      selectedBookableFilter === 'LMN Only'
                        ? 'bg-gray-400 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    LMN Only
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

