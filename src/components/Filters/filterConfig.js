// Scalable filter configuration
// To add a new filter, just add an object to this array
export const filterDefinitions = [
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    defaultValue: 'all',
    showOnlyWhen: () => false, // Hide category dropdown, keep for category pills
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
];

// Helper to get initial state from definitions
export const getInitialFilters = () => {
  return filterDefinitions.reduce((acc, filter) => {
    acc[filter.id] = filter.defaultValue;
    return acc;
  }, {});
};
