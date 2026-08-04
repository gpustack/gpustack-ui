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

## Tables

Two implementations coexist. Reach for core-ui's `Table` (conventionally imported as `SealTable`) in new and migrated pages; antd `Table` survives only where a page hasn't been migrated yet. They are not interchangeable — core-ui's is a CSS-grid table, not an antd wrapper, so `scroll` behaves differently on each. Ref `src/pages/resources/components/workers.tsx`.

- **core-ui `Table` columns**: `span` is a column's proportional share of the leftover width, as an `fr` track — **leave it off to divide the width evenly**, since every column defaults to `1fr`. Only set it where a column genuinely needs more or less room than its neighbours, and then keep the spans summing to a round grid. What every column _should_ carry is a `minWidth` floor: spans share only the width left over **once every floor is satisfied**, so the floors are what decide when the table starts scrolling.
- **Horizontal scroll, core-ui `Table`**: `scroll={{ x: true }}` widens the row out to the columns' own floors (sum of `minWidth` + the prefix gutter) and scrolls past that. An explicit px value works too. Do **not** pass `'max-content'`: on a grid of `fr` tracks the greediest cell sets the `fr` unit for _every_ track, so one wrap-happy cell (a `LabelCell` full of tags) inflates the whole table — measured at 4694px against the 1370px the columns actually needed. No extra class: the scrollbar styling ships with the component.
- **Vertical scroll, core-ui `Table`**: `scroll={{ y }}` caps the **body** (antd's semantics) and sticks the header to the top of the same scroll viewport. Note that CSS forces `overflow-x` to `auto` alongside `overflow-y: auto`, so a `y`-only table whose columns are wider than the viewport will still show a horizontal scrollbar.
- **Horizontally scrollable antd `Table`**: set `scroll={{ x: 'max-content' }}` **and** add `className="scroll-table"` on the `Table`. The class styles the horizontal scroll to match the design; without it the scroll works but looks off. `'max-content'` is right here — antd sizes real table columns by content, so it has no `fr`-unit amplification to worry about.

# Naming conventions

A page module lives under `src/pages/{module}` with this sub-structure: `components/`, `config/`, `forms/`, `hooks/`, `services/`, `index.tsx`. File naming:

- **Create/edit modal**: `add-{feature}-modal.tsx` (keep the `-modal` suffix even when built with `FormDrawer`).
- **Table columns hook**: `use-{feature}-columns.tsx`.
- **Open/close & request hooks**: `use-{verb}-{noun}.ts` (e.g. `use-create-user.ts`, `use-query-user-list.ts`).
- **Complex table cell**: extract into `{feature}-cell.tsx`.

# Module structure & file size

## Split by reason-to-change, not by line count

Line count is a smoke alarm, not the criterion. A 300-line file with two unrelated concerns should be split; a 700-line controlled form whose fields all interlock should not. Decide with these three questions, in order:

**1. How many independent reasons-to-change does the file hold?** Two or more that don't share state → split, extracting sub-components into `components/` and state / request / derivation logic into `hooks/`. One concern that is simply large → leave it. A list tab that fetches, filters, defines columns and lays out sections holds four; a cascading form whose every field feeds the next holds one, however long it gets.

Watch for the near-miss: a column definition and the cell it renders look like two things but are **one** reason-to-change — adding a column means adding its cell, and changing a cell means finding its column. Splitting them yields a file that only forwards `record` to the other. Same trap for a form and its field renderers, or a request hook and its response mapper.

**2. Can the extracted piece take a domain name?** `use-keys-columns`, `instance-status-cell`, `use-query-benchmarks` → the seam is real. If the only name you can find is `-utils`, `-helpers`, `-part2`, or the parent's name with a suffix, you are cutting mid-concern — don't.

**3. How many props would the split need?** More than 2–3, or having to pass a `form` instance / a `setState` down, means the seam is in the wrong place. That prop list is the coupling you failed to cut.

Line count only decides **when to run this checklist**, not its outcome: past **~600 lines**, stop and walk the three questions. Never split just to get under the number — every extra file costs real navigation time, so only pay it where the seam is genuine.

A naming convention can outrank all of the above: `use-{feature}-columns` is extracted even from a 300-line tab, because table columns change for their own reasons (design tweaks) independently of the tab's business logic. Ref `src/pages/api-keys/hooks/use-keys-columns.tsx`.

## One directory per tab

If a page is composed of multiple tabs, **each tab gets its own directory** under the page directory, with the same internal structure as a page (`components/`, `config/`, `forms/`, `hooks/`, `services/`, `index.tsx` — only the parts it needs). Do not flatten every tab's components into the page-level `components/`.

The page-level `components/`, `hooks/`, `config/`, and `services/` are reserved for things **shared across tabs**; anything used by a single tab belongs to that tab's directory.

```
src/pages/usage/
  components/        # shared across tabs only
  config/
  hooks/
  services/
  index.tsx          # tab host
  events-tab/
    services/
    index.tsx
  summary-tab/
    components/
    hooks/
    index.tsx
```

Name the directory after the tab. Both `{tab}-tab/` (e.g. `src/pages/usage/events-tab`) and plain `{tab}/` (e.g. `src/pages/gpu-service/instances`) exist today — stay consistent with whatever the page already uses.

Two rules of thumb for deciding where a file lives:

- A component used by **two or more** tabs goes to the page-level `components/` — even when one of them "owns" it conceptually. Putting it in the owner's directory would force the other tab into a `../{sibling-tab}/components/...` import, and a cross-tab-directory import is the signal that the file belongs one level up.
- Keep a shared child's **whole dependency chain** at page level. Moving the parent up but leaving its children in a tab directory just relocates the same cross-directory import.

The converse also holds: a file sitting in the page-level `components/` with only **one** consumer tab belongs in that tab's directory.

# Config & types

- `config/types.ts` — TypeScript types. Form shape → `FormData`; table/list row → `ListItem`.
- `config/index.ts` — static constants, enums, and value/label maps (e.g. `XxxStatusValueMap`, `XxxStatusLabelMap`). Keep constants out of `types.ts`.
- **`Select` options that need i18n**: set `label` to the message key and add `locale: true` on the option — the field translates it at render. Omit `locale` for options whose label is already final text. Ref `src/pages/benchmark/config/index.ts`.

When `types.ts` grows past a few hundred lines and covers several backend domains, promote it to a `config/types/` directory: one file per domain (`instance.ts`, `template.ts`, `storage.ts`, …), shared primitives in `common.ts`, and an `index.ts` barrel that `export type *` re-exports all of them. The barrel keeps `from '../config/types'` resolving unchanged, so no import site has to move. Always import from the barrel, not from a domain file directly. No page uses the directory form yet — `src/pages/llmodels/config/types.ts` is the first candidate if it keeps growing.

# Common components

Always check `@gpustack/core-ui` first. Frequently reused:

- **Drawer/Modal open/close**: `useBodyScroll`.
- **Form drawer / footer**: `FormDrawer`, `ModalFooter`.
- **Delete confirmation**: `DeleteModal`.
- **Search + bulk actions bar**: `FilterBar`.
- **Form fields**: `BaseSelect`, `Input` (labeled).
- **Text overflow**: `AutoTooltip`.
- **Icons**: `IconFont`.
- **Tags & status** (4 variants): see the section below.
- **Permission-gated visibility**: `Access` / `useAccess`.
- **Request hooks**: `useRequest` / `useQueryData` / `useQueryDataList`.
- **Table data fetching**: `useTableFetch`.
- **Submit guard** (prevent double-submit): `useSubmitLock`.
- **Tabbed forms**: `ScrollSpyTabs`.

# Tags & status indicators

Four core-ui components cover tag/status display in tables and lists. Pick by **what the value means**, not by how it looks — don't reach for a generic antd `Tag`:

- **`StatusTag`** — semantic status with a **dynamic message/detail** (tooltip, download, extra content). Use when a row's status carries variable text, e.g. a failed job with an error message. Colors come from `StatusColorMap` (error/warning/transitioning/success/inactive).
- **`StatusDot`** — colored dot + short label, **no message**. Use for a plain status/type cell where the value is a fixed enum (e.g. an event-type or log column). Same `StatusColorMap` palette; `inactive` dot is quaternary. If the status needs dynamic text, use `StatusTag` instead.
- **`ThemeTag`** — a **standalone category label** (independent content, e.g. a permission scope or a model name). Default neutral; wraps antd `Tag`.
- **`TextAttribute`** — a small neutral pill that is a **subordinate annotation following a primary text** (e.g. `key-name [custom]`), not a standalone tag. Manages its own leading margin. Two variants: `filled` (default) and `outlined`. Ref the name column in `src/pages/api-keys/hooks/use-keys-columns.tsx`.

Rule of thumb: semantic + dynamic text → `StatusTag`; semantic + fixed enum → `StatusDot`; independent category → `ThemeTag`; annotation of nearby text → `TextAttribute`.

# Dynamic add-item form fields

When building a form, select the add-item component from the **shape of the field's data** (its schema). Match the schema, don't hand-roll a list UI:

- **Plain object** (key→value map) → `LabelSelector`.
- **String array** → `ListInput`. Ref `src/pages/llmodels/forms/backend-parameters-list.tsx`.
- **Object array** → `MetadataList` with a custom item renderer per entry. Ref `src/pages/llmodels/forms/model-lora-list.tsx`.
