import FiltersView from './Filters.view.jsx';

export default function Filters({
  selectedCategory,
  onCategoryChange,
  selectedBookableFilter,
  onBookableFilterChange,
  selectedRadius,
  onRadiusChange,
  hasLocation,
}) {
  return (
    <FiltersView
      selectedCategory={selectedCategory}
      onCategoryChange={onCategoryChange}
      selectedBookableFilter={selectedBookableFilter}
      onBookableFilterChange={onBookableFilterChange}
      selectedRadius={selectedRadius}
      onRadiusChange={onRadiusChange}
      hasLocation={hasLocation}
    />
  );
}
