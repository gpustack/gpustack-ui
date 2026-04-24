## Create form table list

## Create a form

## StatusTag

Use `StatusTag` from `@gpustack/core-ui` for status display. Do not use `Tag` from `antd` directly.

1. Define the mapping from business status values to UI status values in the module's `config/index.ts`:

```ts
import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';

export const XxxStatusValueMap = {
  Running: 'running',
  Pending: 'pending',
  Failed: 'failed'
};

export const XxxStatusLabelMap: Record<string, string> = {
  [XxxStatusValueMap.Running]: 'Running',
  [XxxStatusValueMap.Pending]: 'Pending',
  [XxxStatusValueMap.Failed]: 'Failed'
};

export const status: Record<string, StatusType> = {
  [XxxStatusValueMap.Running]: StatusMaps.success,
  [XxxStatusValueMap.Pending]: StatusMaps.transitioning,
  [XxxStatusValueMap.Failed]: StatusMaps.error
};
```

2. In table columns, pass only the UI status value and display text required by `StatusTag`:

```tsx
<StatusTag
  statusValue={{
    status: status[value],
    text: XxxStatusLabelMap[value] || value,
    message: record.state_message
  }}
/>
```

`statusValue.status` must be a value mapped from `StatusMaps`, such as `success`, `transitioning`, `warning`, `error`, or `inactive`. Do not pass business status values such as `running` or `pending` directly.
