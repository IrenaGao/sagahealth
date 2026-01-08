import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getInitialFilters } from './filterConfig';

export const useFilterStore = create(
  persist(
    (set) => ({
      // Filter values
      filters: getInitialFilters(),
      
      // User location (needed for conditional filters)
      userLocation: null,
      
      // Search query
      searchQuery: '',
      
      // Actions
      setFilter: (filterId, value) =>
        set((state) => ({
          filters: { ...state.filters, [filterId]: value },
        })),
      
      setMultipleFilters: (updates) =>
        set((state) => ({
          filters: { ...state.filters, ...updates },
        })),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setUserLocation: (location) => set({ userLocation: location }),
      
      resetFilters: () =>
        set({
          filters: getInitialFilters(),
          searchQuery: '',
        }),
      
      resetAllIncludingLocation: () =>
        set({
          filters: getInitialFilters(),
          searchQuery: '',
          userLocation: null,
        }),
    }),
    {
      name: 'wellness-filters', // LocalStorage key
      partialPersist: (state) => ({
        // Only persist filters and search, not location
        filters: state.filters,
        searchQuery: state.searchQuery,
      }),
    }
  )
);
