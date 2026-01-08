# Filters Component - Zustand Architecture

## Why Zustand?

✅ **Persistence**: Filter selections persist across page navigation and browser sessions
✅ **Global State**: Any component can access/modify filters without prop drilling
✅ **Performance**: Only components using specific filters re-render
✅ **Simple API**: Less boilerplate than Redux
✅ **Scalable**: Easy to add new filters

## Architecture

```
Filters/
├── filterConfig.js      # Define all filters here (SINGLE SOURCE OF TRUTH)
├── filterStore.js       # Zustand store with state & actions
├── Filters.controller.jsx  # Minimal controller
└── Filters.view.new.jsx    # Dynamic UI rendering
```

## How to Add a New Filter (3 Steps)

### Step 1: Add filter definition to `filterConfig.js`

```javascript
{
  id: 'priceRange',              // Unique ID
  label: 'Price Range',          // Display label
  type: 'select',                // Type: 'select', 'multiselect', 'checkbox', etc.
  defaultValue: 'all',           // Default value
  showOnlyWhen: (state) => true, // Optional: conditional display
  options: [
    { value: 'all', label: 'All Prices' },
    { value: 'low', label: '$' },
    { value: 'medium', label: '$$' },
    { value: 'high', label: '$$$' },
  ],
}
```

### Step 2: Use in filtering logic

```javascript
const priceRange = useFilterStore((state) => state.filters.priceRange);

const filtered = providers.filter(provider => {
  if (priceRange === 'all') return true;
  return provider.priceRange === priceRange;
});
```

### Step 3: Done! ✨

The UI automatically renders the new filter. No need to update components.

## Usage Examples

### Access filters anywhere

```javascript
import { useFilterStore } from './components/Filters/filterStore';

// In any component
function MyComponent() {
  const category = useFilterStore((state) => state.filters.category);
  const setFilter = useFilterStore((state) => state.setFilter);
  
  return (
    <button onClick={() => setFilter('category', 'yoga')}>
      Show Yoga
    </button>
  );
}
```

### Reset filters

```javascript
const resetFilters = useFilterStore((state) => state.resetFilters);
resetFilters(); // Resets to defaults
```

### Batch updates

```javascript
const setMultipleFilters = useFilterStore((state) => state.setMultipleFilters);
setMultipleFilters({ category: 'yoga', radius: 10 });
```

## Filter Definition Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier |
| `label` | string | ✅ | Display label |
| `type` | string | ✅ | 'select', 'multiselect', etc. |
| `defaultValue` | any | ✅ | Default value |
| `options` | array | ✅ | Array of {value, label} |
| `showOnlyWhen` | function | ❌ | Conditional display: `(state) => boolean` |

## Persisted State

Filters are automatically saved to localStorage under the key `wellness-filters`.

**Persisted:**
- Filter selections
- Search query

**Not Persisted:**
- User location (requires fresh permission)

## Future Extensions

Easy to add:
- Multi-select filters
- Range sliders
- Date pickers
- Tag-based filters
- Search filters with autocomplete

Just add to `filterConfig.js` and extend the view renderer!
