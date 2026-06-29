# Repo

This is the **open source UI** (`gpustack-ui`). Common `components`, `hooks`, and `utils` are published as `@gpustack/core-ui` and consumed throughout `src`.

**Always prioritize reusing common `components`, `hooks`, and `utils` from `@gpustack/core-ui`.**

Task-specific conventions live in skills: use **create-crud-page** when building a page module, **form-patterns** when building cascading/dependent forms.

# React State and Request Patterns

Keep data flow explicit, predictable, and performant. The triggering **action** is the source of truth for UI updates — not effect-driven synchronization.

## 1. Avoid effect-driven requests

Do not use request functions as `useEffect` dependencies. Trigger requests explicitly from user actions or lifecycle entry points.

```ts
// Avoid
useEffect(() => {
  fetchData();
}, [fetchData]);
```

## 2. Form requests should be action-driven

- Fetch form data (e.g. `Select` options) when the form first opens.
- If later requests depend on interactions, trigger them inside the interaction handler.
- Do not rely on `useEffect` dependency changes.

```ts
// Recommended
const handleOnChange = (value) => {
  fetchData(value);
};
```

## 3. Update related states together

When one action updates multiple related states, update them all directly in the handler. Do not sync via `useEffect` or derive indirectly via `useMemo`.

```ts
const handleOnChange = (value) => {
  setState1(...);
  setState2(...);
  buildState(...);
};
```

## 4. Group strongly related state

If multiple states always update together, use a single state object instead of multiple `useState` calls — fewer rerenders, more predictable transitions.

```ts
const [state, setState] = useState({ state1: ..., state2: ..., state3: ... });
```

## 5. Prefer explicit state flow

Keep request execution, state updates, and derived calculations close to the triggering action. Avoid chaining business logic through multiple `useEffect` hooks.

```ts
// Prefer
const handleAction = () => {
  fetchData();
  setTableData(...);
  setSelectedRow(...);
};
```

## 6. Avoid premature memoization

Do not use `useMemo` / `useCallback` unless there is a confirmed bottleneck. Overuse adds complexity, obscures state flow, and risks stale dependencies. Optimize only when necessary.

## 7. Keep request logic predictable

A user interaction should clearly show: what request fires, which states update, how the UI changes. Avoid indirect update chains from dependency-driven effects.

## 8. Prefer action-driven architecture

Prefer action-driven updates, explicit handlers, and localized state transitions over effect-driven synchronization, cross-hook implicit updates, and reactive chains between states.

# Styles

Avoid `styled-components` for complex or large-scale styling. Prefer:

1. `createStyles` for component-scoped dynamic styles
2. CSS Modules (`xxx.module.less`) for structured static styles

# Common components

- **Drawer/Modal open/close**: `useBodyScroll` from `@gpustack/core-ui`.
- **Status display** (success/failed/processing/warning): `StatusTag`.
- **Permission-gated visibility**: `Access` / `useAccess`.
- **Request hooks**: `useRequest` / `useQueryData` / `useQueryDataList` from `@gpustack/core-ui`.
- **Table data fetching**: `useTableFetch` from `@gpustack/core-ui`.
