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

      // Show only Supabase providers
      supabaseOnly: false,

      // Show only Supabase providers without an address (apps)
      appsOnly: false,
      
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

      setSupabaseOnly: (value) => set({ supabaseOnly: value }),

      setAppsOnly: (value) => set({ appsOnly: value }),
      
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
        // Only persist filters and search, explicitly exclude location
        filters: state.filters,
        searchQuery: state.searchQuery,
      }),
      // Ensure userLocation is never restored from localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.userLocation = null; // Always reset location on app restart
        }
      },
    }
  )
);
