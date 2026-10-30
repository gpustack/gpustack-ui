# KeyValueFilter

A controlled, API-independent filter for exact key/value conditions. The trigger looks like a search field; its popover uses the same surface as Benchmark Filters. Keys and their existing values are searchable core-ui `BaseSelect` controls.

`KeyValueFilter` owns the trigger and popover. `KeyValueFilterEditor` owns all row state, incomplete drafts, deduplication, and completed-condition updates. The stateless `KeyValueFilterRow` presents a single row and reports changes, deletion, and addition through callbacks.

```tsx
import KeyValueFilter, {
  type KeyValueFilterValue
} from '@/pages/_components/key-value-filter';

const [filters, setFilters] = useState<KeyValueFilterValue[]>([]);

<KeyValueFilter
  value={filters}
  onChange={setFilters}
  options={[
    { key: 'env', values: ['production', 'staging'] },
    { key: 'team', values: ['backend', 'frontend'] }
  ]}
/>;
```

- Selecting a value applies the completed conditions immediately. `+` adds an editable row. The value field stays enabled; opening it without a key shows a prompt to select a key first. Incomplete rows never enter `onChange`.
- Changing a row's key clears its value and removes that row's active condition until a new value is selected. Adding or deleting an incomplete row does not issue a change.
- Delete removes a row. Clear removes every condition. Escape closes the popover and returns focus to the trigger; an open select handles Escape first.
- Values remain literal, including empty strings, spaces, commas, and `=`. Empty values have a localized display label. Identical pairs are deduplicated; the caller owns query serialization and AND/OR semantics.
- `value` remains authoritative, including external replacements while open. Missing options do not erase active conditions. Closing discards incomplete drafts.
- Supply `loading`, `disabled`, `title`, `placeholder`, `keyPlaceholder`, `valuePlaceholder`, `width`, `popoverWidth`, `className`, or `style` as needed. Defaults are translated in all five supported locales. Opening with Enter, Space, or Arrow Down focuses the first key selector.
- The component makes no requests. Pages own fetching, permissions, scope, and refreshing the options.
