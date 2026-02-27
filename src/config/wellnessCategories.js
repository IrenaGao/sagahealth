// Shared wellness category types used across the application
export const INCLUDED_TYPES = [
  "gym",
  "pilates",
  "yoga",
  "massage",
  "spa",
  "acupuncture",
  "chiropractor",
  "sauna",
];

// Convert category type to display format (capitalize and replace underscores)
export const formatCategoryDisplay = (category) => {
  if (!category) return '';
  return category
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Convert display format back to type format for matching
export const formatCategoryType = (display) => {
  if (!display) return '';
  return display
    .toLowerCase()
    .replace(/\s+/g, '_');
};

// Get display categories for UI (includes "All")
export const getDisplayCategories = () => {
  return ['All', ...INCLUDED_TYPES.map(formatCategoryDisplay)];
};

