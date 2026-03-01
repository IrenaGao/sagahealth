import { useState, useEffect } from 'react'
import { useFilterStore } from './Filters/filterStore'
import { getDisplayCategories, formatCategoryType, INCLUDED_TYPES, formatCategoryDisplay } from '../config/wellnessCategories'

const categories = getDisplayCategories();

export default function SearchBar() {
  // Get state and actions from Zustand store
  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
  const supabaseOnly = useFilterStore((state) => state.supabaseOnly);
  const setSupabaseOnly = useFilterStore((state) => state.setSupabaseOnly);
  const appsOnly = useFilterStore((state) => state.appsOnly);
  const setAppsOnly = useFilterStore((state) => state.setAppsOnly);

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  // Get current category display name for dropdown
  const getCurrentCategoryDisplay = () => {
    const currentType = filters.category;
    if (currentType === 'all') return 'All';
    return categories.find(cat => {
      const catType = cat === 'All' ? 'all' : formatCategoryType(cat);
      return catType === currentType;
    }) || 'All';
  };

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-[1920px] mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-4 md:pt-4 md:pb-6">
        {/* Category Selection - Responsive */}
        {/* Desktop: Pills */}
        <div className="hidden md:flex gap-2 overflow-x-auto hide-scrollbar">
          {categories.map((category) => {
            const categoryType = category === 'All' ? 'all' : formatCategoryType(category)
            return (
              <button
                key={category}
                onClick={() => { setFilter('category', categoryType); setSearchQuery('') }}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  filters.category === categoryType
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            )
          })}

          {/* Divider */}
          <div className="w-px bg-gray-300 mx-4 self-stretch" />

          {/* Saga Providers pill */}
          <button
            onClick={() => setSupabaseOnly(!supabaseOnly)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              supabaseOnly
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Saga Providers
          </button>

          {/* Apps pill */}
          <button
            onClick={() => setAppsOnly(!appsOnly)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              appsOnly
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Apps
          </button>
        </div>

        {/* Mobile: Dropdown + Saga Providers + Apps */}
        <div className="md:hidden flex items-center justify-center gap-2">
          <div className="relative">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              filters.category !== 'all'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {getCurrentCategoryDisplay()}
            <svg
              className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCategoryDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto min-w-[160px]">
              {categories.map((category) => {
                const categoryType = category === 'All' ? 'all' : formatCategoryType(category)
                const isSelected = filters.category === categoryType
                return (
                  <button
                    key={category}
                    onClick={() => {
                      setFilter('category', categoryType)
                      setShowCategoryDropdown(false)
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center justify-between ${
                      isSelected ? 'bg-emerald-50' : ''
                    } ${category !== categories[categories.length - 1] ? 'border-b border-gray-100' : ''}`}
                  >
                    <span className={`font-medium ${isSelected ? 'text-emerald-700' : 'text-gray-900'}`}>
                      {category}
                    </span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          </div>

          {/* Saga Providers pill */}
          <button
            onClick={() => setSupabaseOnly(!supabaseOnly)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              supabaseOnly
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Saga Providers
          </button>

          {/* Apps pill */}
          <button
            onClick={() => setAppsOnly(!appsOnly)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              appsOnly
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Apps
          </button>
        </div>
      </div>
    </div>
  );
}
