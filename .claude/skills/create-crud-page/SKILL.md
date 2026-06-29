---
name: create-crud-page
description: Scaffold a CRUD list/table page module in the gpustack-ui monorepo. Use when creating a new page module, building a list/table page, adding a create/edit drawer, or setting up the components/config/forms/hooks/services structure for a feature.
---

# Create a CRUD Table Page

## Inputs (do this first)

- The argument passed to this skill is the **module name** (e.g. `/create-crud-page api-keys` → module `api-keys`). If no name was given, ask for it.
- **Always ask the user for the API documentation before generating any code**, even if a module name was provided:

  > Where is the API documentation for this module? (OpenAPI/Swagger URL, schema file path, or an interface description)

- Wait for the answer, then read/fetch it. Derive `config/types.ts` (`FormData`, `ListItem`), the `services` request hooks, and form fields from that schema. Do not guess field names or endpoints — if the doc is missing details, ask.

- **Also ask which form layout to scaffold:**

  > Should the form use tabs? (1) a plain form without tabs, or (2) a tabbed form

  Choose the form structure in section 3 accordingly. Default to **no tabs** unless the user picks tabs or the schema clearly has many grouped sections.

---

Before anything: **reuse common `components`, `hooks`, and `utils` from `@gpustack/core-ui` whenever possible.**

Reference implementation for sections below: `src/pages/model-routes`.

## Module structure

Create the module under `src/pages/{module}`:

```text
{module}
├── components
├── config
├── forms
├── hooks
├── index.tsx
└── services
```

## 1. components

Module-specific components.

- The create/edit form component is named `add-xxx-modal.tsx` (repo convention — keep the `-modal` suffix even though it is built with `FormDrawer`).
- Use `FormDrawer` from `@gpustack/core-ui`.
- If a table cell's render logic/structure is complex, extract it into `xxx-cell.tsx`.

## 2. config

```text
config
├── index.ts   # static configs & constants
└── types.ts   # TypeScript types
```

Naming: form types → `FormData`; table list item types → `ListItem`.

## 3. forms

Main form component goes in `forms/index.tsx`.

- **Complex interactions** (Form.Item split across components): create a dedicated Form Context and wrap with `FormContext.Provider`.
- **Tab-based forms**: use `ScrollSpyTabs` from `@gpustack/core-ui`, wrapping the `Form` or `FormContext.Provider`. Do not use tabs unless necessary.
- **Required-field validation**: use `getRuleMessage` for standard `input`/`select`.
- For cascading selectors and async race protection, follow the **form-patterns** skill.

## 4. hooks

- Table columns → `use-xxx-columns.tsx`.
- Open/close hooks for `add-xxx-modal.tsx` → `use-create-xxx.ts`.

## 5. index.tsx (list page entry)

- **Data fetching**: `useTableFetch` from `@gpustack/core-ui`.
- **Data display**:
  - Standard table → Ant Design `Table`. Ref: `src/pages/users/index.tsx`.
  - Expandable/collapsible rows → `Table` from `@gpustack/core-ui`. Ref: `src/pages/model-routes/index.tsx`.
  - Card-style lists → use `InfiniteScrollerProvider`. Ref: `src/pages/backends/index.tsx`.

## 6. services

`request` is injected via a provider — do **not** create a centralized `apis` directory like in `gpustack-ui`. Define request hooks directly in `services`.

- Use `useRequest` from `@gpustack/core-ui`, or `useQueryData` (same underlying method).
- Ref: `src/pages/gpu-service/storage-types/services/use-create-storage-type.ts`.

## 7. Empty data

- Page table lists → `NoResult`.
- Simple (non-page) tables → `Empty` with `image={Empty.PRESENTED_IMAGE_SIMPLE}`.

## Common UI conventions

- **Drawer/Modal open/close**: use `useBodyScroll` from `@gpustack/core-ui`. Ref: `src/pages/model-routes/hooks/use-create-route.ts`.
- **Status display** (success/failed/processing/warning): use `StatusTag`. Ref: `src/pages/llmodels/components/table-list.tsx`.
- **Permission-gated visibility**: use `Access` / `useAccess`. Ref: `src/pages/access/index.tsx`.
- **Styles**: avoid `styled-components` for complex/large styling. Prefer `createStyles` for component-scoped dynamic styles, CSS Modules (`xxx.module.less`) for static structured styles.
