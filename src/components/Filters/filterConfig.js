// Scalable filter configuration
// To add a new filter, just add an object to this array
export const filterDefinitions = [
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    defaultValue: 'all',
    options: [
      { value: 'all', label: 'All Categories' },
      { value: 'gym', label: 'Gym' },
      { value: 'massage', label: 'Massage Therapy' },
      { value: 'acupuncture', label: 'Acupuncture' },
      { value: 'yoga', label: 'Yoga' },
      { value: 'meditation', label: 'Meditation' },
      { value: 'nutrition', label: 'Nutrition' },
      { value: 'fitness', label: 'Fitness' },
      { value: 'mental health', label: 'Mental Health' },
      { value: 'physical therapy', label: 'Physical Therapy' },
      { value: 'chiropractic', label: 'Chiropractic' },
    ],
  },
  {
    id: 'bookableFilter',
    label: 'Booking Type',
    type: 'select',
    defaultValue: 'all',
    options: [
      { value: 'all', label: 'All Providers' },
      { value: 'bookable', label: 'Bookable Online' },
      { value: 'non-bookable', label: 'Contact to Book' },
    ],
  },
  {
    id: 'radius',
    label: 'Distance',
    type: 'select',
    defaultValue: 50,
    showOnlyWhen: (state) => !!state.userLocation, // Only show when location exists
    options: [
      { value: 5, label: '5 miles' },
      { value: 10, label: '10 miles' },
      { value: 25, label: '25 miles' },
      { value: 50, label: '50 miles' },
      { value: 100, label: '100 miles' },
    ],
  },
];

// Helper to get initial state from definitions
export const getInitialFilters = () => {
  return filterDefinitions.reduce((acc, filter) => {
    acc[filter.id] = filter.defaultValue;
    return acc;
  }, {});
};
