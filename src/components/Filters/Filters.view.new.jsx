import { useFilterStore } from './filterStore';
import { filterDefinitions } from './filterConfig';

export default function FiltersView() {
  const filters = useFilterStore((state) => state.filters);
  const userLocation = useFilterStore((state) => state.userLocation);
  const setFilter = useFilterStore((state) => state.setFilter);

  // Filter definitions based on conditions
  const visibleFilters = filterDefinitions.filter((filterDef) => {
    if (filterDef.showOnlyWhen) {
      return filterDef.showOnlyWhen({ userLocation });
    }
    return true;
  });

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {visibleFilters.map((filterDef) => (
            <div key={filterDef.id} className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {filterDef.label}
              </label>
              {filterDef.type === 'select' && (
                <select
                  value={filters[filterDef.id]}
                  onChange={(e) => {
                    const value = filterDef.id === 'radius' 
                      ? Number(e.target.value) 
                      : e.target.value;
                    setFilter(filterDef.id, value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {filterDef.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
