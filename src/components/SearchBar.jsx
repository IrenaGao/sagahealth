const categories = ['All', 'Gym', 'Massage', 'Pilates', 'Yoga', 'Spa', 'Meditation'];

export default function SearchBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 pt-6 pb-4">
        {/* Logo and Search Input Row */}
        <div className="flex items-center gap-6 md:gap-8 mb-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Saga Health</h1>
          </div>
          
          {/* Search Input */}
          <div className="w-full sm:w-96 md:w-[500px] lg:w-[600px]">
            <input
              type="text"
              placeholder="Search wellness services, locations..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>
        
        {/* Category Chips - Aligned with search bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar ml-[56px] sm:ml-[174px] md:ml-[186px]">
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
        </div>
      </div>
    </div>
  );
}

