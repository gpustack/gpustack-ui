# Repo

This is the **open source UI** (`gpustack-ui`). Common `components`, `hooks`, and `utils` are published as `@gpustack/core-ui` and consumed throughout `src`.

**Always prioritize reusing common `components`, `hooks`, and `utils` from `@gpustack/core-ui`.**

Task-specific conventions live in skills: use **create-crud-page** when building a page module, **form-patterns** when building cascading/dependent forms.

# Build validation

Before finishing work on forms, modals, or shared types, run the full validation pipeline:

```bash
pnpm run validate
```

This runs `scripts/lint` (ESLint) and `scripts/build` (production build). CI runs the same steps on every pull request.

For type-level regressions, also run:

```bash
pnpm run typecheck
```

The repo still has legacy TypeScript debt, so `typecheck` is **not** a CI gate yet — use it locally when you touch types, refs, or form/modal code.

Fix all lint errors and build failures before considering the task done.

# Form refs & modals

Runtime errors like `resetFields is not a function` come from calling an imperative form ref before the child mounts, or from an untyped `useRef<any>` that hides a broken API contract. These are not caught by `pnpm run build` alone.

## Typed imperative handles

- Define a handle interface next to the form component (e.g. `DeployDataFormHandle`).
- Parent modals must use `useRef<DeployDataFormHandle>(null)` — **never** `useRef<any>(null)` for form refs in new or touched code.
- Expose one consistent API from `useImperativeHandle`: either wrapper methods (`resetFields`, `setFieldsValue`, `submit`) **or** the inner Ant Design `FormInstance` via `.form` — do not mix both styles in the same parent.

```ts
export type DeployDataFormHandle = {
  submit: () => void;
  resetFields: (fields?: string[]) => void;
  setFieldsValue: (values: Partial<FormData>) => void;
  getFieldValue: (name: string) => unknown;
};

const formRef = useRef<DeployDataFormHandle>(null);
```

## Lifecycle guards

- Do not call `formRef.current?.method()` from async fetch/effect paths until the drawer is open **and** the form child is rendered.
- Child components that auto-select defaults after fetch (e.g. search → pick first model) must not invoke parent form mutations until the parent confirms the form ref is ready, or guard with `typeof formRef.current?.resetFields === 'function'`.
- Prefer optional chaining on the **method** too: `formRef.current?.resetFields?.(fields)`, not only on `current`.

## Manual smoke-test

After changing modal/drawer forms, manually verify: open → wait for data load / auto-select → change selection → submit. Watch the dev overlay for unhandled rejections.

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

**Future direction (apply to all new code):** avoid `styled-components`. Prefer:

1. `createStyles` for component-scoped dynamic styles
2. CSS Modules (`xxx.module.less`) for structured static styles

Existing `styled-components` usage is legacy tech debt — do not migrate it wholesale, but do not add new `styled-components` either. Theme tokens (`var(--ant-color-*)`) work in all three approaches.

## Layout

Compose layout with Ant components, not hand-written `display: flex`.

- **1D flex** (row/column with `gap`, `align`, `justify`) → `Flex`. Do not write raw `display: flex` in new code.
- **Inline sequence** of a few elements with uniform spacing → `Space`.
- **Page/grid columns** → `Row` / `Col`.

Drive spacing with the theme scale (`Flex`/`Space` `gap`, or `var(--ant-*)` spacing tokens), not scattered `px` literals.

# Naming conventions

A page module lives under `src/pages/{module}` with this sub-structure: `components/`, `config/`, `forms/`, `hooks/`, `services/`, `index.tsx`. File naming:

- **Create/edit modal**: `add-{feature}-modal.tsx` (keep the `-modal` suffix even when built with `FormDrawer`).
- **Table columns hook**: `use-{feature}-columns.tsx`.
- **Open/close & request hooks**: `use-{verb}-{noun}.ts` (e.g. `use-create-user.ts`, `use-query-user-list.ts`).
- **Complex table cell**: extract into `{feature}-cell.tsx`.

# Config & types

- `config/types.ts` — TypeScript types. Form shape → `FormData`; table/list row → `ListItem`.
- `config/index.ts` — static constants, enums, and value/label maps (e.g. `XxxStatusValueMap`, `XxxStatusLabelMap`). Keep constants out of `types.ts`.
- **`Select` options that need i18n**: set `label` to the message key and add `locale: true` on the option — the field translates it at render. Omit `locale` for options whose label is already final text. Ref `src/pages/benchmark/config/index.ts`.

# Common components

Always check `@gpustack/core-ui` first. Frequently reused:

- **Drawer/Modal open/close**: `useBodyScroll`.
- **Form drawer / footer**: `FormDrawer`, `ModalFooter`.
- **Delete confirmation**: `DeleteModal`.
- **Search + bulk actions bar**: `FilterBar`.
- **Form fields**: `BaseSelect`, `Input` (labeled).
- **Text overflow**: `AutoTooltip`.
- **Icons**: `IconFont`.
- **Status display** (success/failed/processing/warning): `StatusTag`.
- **Permission-gated visibility**: `Access` / `useAccess`.
- **Request hooks**: `useRequest` / `useQueryData` / `useQueryDataList`.
- **Table data fetching**: `useTableFetch`.
- **Submit guard** (prevent double-submit): `useSubmitLock`.
- **Tabbed forms**: `ScrollSpyTabs`.

# Dynamic add-item form fields

When building a form, select the add-item component from the **shape of the field's data** (its schema). Match the schema, don't hand-roll a list UI:

- **Plain object** (key→value map) → `LabelSelector`.
- **String array** → `ListInput`. Ref `src/pages/llmodels/forms/backend-parameters-list.tsx`.
- **Object array** → `MetadataList` with a custom item renderer per entry. Ref `src/pages/llmodels/forms/model-lora-list.tsx`.
