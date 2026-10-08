# ResponsiveFilters

A controlled filter toolbar. Pass a configuration array, values, and a change handler; the component renders controls, moves overflow into a scrollable popover, counts active conditions, and clears the conditions in that popover.

```tsx
import ResponsiveFilters, {
  type ResponsiveFilterConfig
} from '@/components/responsive-filters';

interface Values {
  name: string;
  status?: string;
}

const filters: ResponsiveFilterConfig<Values>[] = [
  {
    key: 'name',
    type: 'input',
    label: 'Name',
    placeholder: 'Filter by name',
    width: 200
  },
  {
    key: 'status',
    type: 'select',
    placement: 'popover',
    label: 'Status',
    placeholder: 'Filter by status',
    options: [
      { label: 'Running', value: 'running' },
      { label: 'Stopped', value: 'stopped' }
    ]
  }
];

// Inside the page, with controlled state:
<ResponsiveFilters
  filters={filters}
  values={values}
  onChange={(patch) => setValues((previous) => ({ ...previous, ...patch }))}
  suffix={<Button onClick={refresh}>Refresh</Button>}
/>;
```

- `type`: `input` uses the original compact Ant Input; `select` uses core-ui `BaseSelect`; `options` displays flat rows; `custom` uses `render(context)`.
- `placement`: defaults to `auto`. Auto controls appear in configuration order and move from the end when space runs out. `popover` always stays inside.
- `width`: the toolbar width in pixels, default 160. Popover controls fill its width, default 220; change that with `popoverWidth`.
- `clearValue`: defaults to `''` for inputs and `undefined` otherwise. Supply a reset value for custom fields, such as `[]`, `null`, or `false`.
- `isActive`: overrides counting. By default, `0` and `false` count as selected; `undefined`, `null`, `''`, and empty arrays do not.
- `onChange(patch, info)`: one patch per action. `info.reason` is `change` or `clear`; change includes the field config, clear includes affected configs. Pages own debouncing and requests. Resize and open/close never emit changes.
- `custom.render({ value, onChange, onOpenChange })`: custom controls must fill their wrapper width and report dropdown visibility with `onOpenChange` when they render outside the wrapper. Focus and open dropdowns pause relocation.

The filter button sits after visible controls and before `suffix`. It reserves its width so moving controls does not make the layout oscillate. Popover fields retain configuration order; count and bulk clear only affect those fields. When no fields are inside the popover, its button is disabled.

`ResponsiveFilterBar` allocates the remaining space after the right toolbar actions. Its props are the same as core-ui's `FilterBar`.
