/**
 * Capitalizes the first letter of every word in a string
 * Replaces underscores with spaces before capitalizing
 * @param {string} str - The string to capitalize
 * @returns {string} - The string with each word capitalized
 */
export const capitalizeWords = (str) => {
  if (!str) return ''
  
  return str
    .toLowerCase()
    .replace(/_/g, ' ') // Replace underscores with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const buildIlikePattern = (input) => {
  if (!input) return '';
  const decoded = decodeURIComponent(input);
  const normalized = decoded
    .replace(/[_-]+/g, '%')
    .replace(/%+/g, '%');
  return `%${normalized}%`;
};