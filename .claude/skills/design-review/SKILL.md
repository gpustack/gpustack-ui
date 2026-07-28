---
name: design-review
description: Review a page, drawer, or form in the gpustack-ui (open source) codebase against the product's design principles (semantic color, system feedback, focus/density, accessibility, consistency, destructive actions). Use when the user asks for a design/UX review, a "design 体检", or wants to check a screen against the design system before shipping. Reports ranked findings, not a rewrite.
---

# Design Review

Review one screen (a page module, a drawer, a form, or a component) against GPUStack UI's design principles and report concrete, ranked findings. This is a **review**, not a refactor — do not edit unless the user asks. Point at `file:line`, say what's wrong, propose the fix.

The principle layer below is adapted from Apple's Human Interface Guidelines (semantic color, always-visible system state, focus, accessibility), narrowed to a **data-dense desktop admin web app**. Skip HIG's touch/gesture/whitespace-maximalism — it doesn't apply here. What applies is already encoded in the core-ui component conventions; most findings are "a core-ui primitive exists for this and wasn't used."

## How to run

1. Read the target file(s). If given a module, read `index.tsx`, its `components/`, `forms/`, and the columns hook.
2. Walk each check below against the code.
3. Report findings **ranked most-severe first**. For each: `file:line`, one-sentence problem, the principle it violates, and the concrete fix (name the core-ui component/prop). If a screen is clean, say so — don't invent findings.

## Checks

### 1. Consistency — reuse core-ui, don't hand-roll (highest priority)

Most design defects here are a hand-rolled version of something core-ui already standardizes. Flag any of:

- **Raw `display: flex` in new code** — compose layout with Ant components instead: 1D flex → `Flex`; inline sequence → `Space`; page/grid columns → `Row`/`Col`. Drive spacing with the theme scale, not scattered `px` literals.
- A hand-built drawer instead of `FormDrawer` (forms) or the drawer primitives; a custom search/bulk bar instead of `FilterBar`; a bespoke delete confirm instead of `DeleteModal`; a raw icon glyph instead of `IconFont`.
- A hand-rolled list-add UI instead of the schema-matched field (`LabelSelector` for object / `ListInput` for string[] / `MetadataList` for object[] — see CLAUDE.md "Dynamic add-item form fields").

### 2. Semantic color — pick the tag by MEANING, never a generic antd `Tag`

Colors carry meaning; different meanings must not share a color, and one meaning must not change color between screens. Flag:

- `Tag` from `antd` used for a status/category. Route to the right of the four core-ui components by **what the value means**:
  - semantic status **with dynamic text** (error message, detail) → `StatusTag`
  - semantic status, **fixed enum, no message** → `StatusDot`
  - **standalone category** label (scope, model name) → `ThemeTag`
  - **annotation trailing another text** (`name [custom]`) → `TextAttribute` (ref `src/pages/api-keys/hooks/use-keys-columns.tsx`)
- Hardcoded hex/rgb for a semantic state instead of `StatusColorMap` (error/warning/transitioning/success/inactive) or `var(--ant-color-*)` tokens.
- A business status value (`running`, `pending`) passed straight to `StatusTag.status` instead of being mapped through `StatusMaps` (see the "Status display" section of **create-crud-page**). Ref `src/pages/llmodels/components/table-list.tsx`.

Token source of truth (look up values here, don't memorize them): `StatusColorMap` / `StatusMaps` are defined in `src/config/index.ts`; spacing/color primitives are the antd theme `var(--ant-*)` tokens. Never hardcode a value the theme already names.

### 3. System state & feedback — the user must always know what's happening

- Async actions (deploy, delete) must show loading state; a submit button that can double-fire needs `useSubmitLock`.
- A failed/errored row must surface its message — use `StatusTag` with `message`, not a silent color.
- Table/list loading and empty states present: page lists → `NoResult`; simple tables → `Empty` with `image={Empty.PRESENTED_IMAGE_SIMPLE}`.

### 4. Focus & information density

- Drawer/modal open-close uses `useBodyScroll`. Widen a drawer only when content needs it — flag a wide drawer with sparse content.
- A form cramming many ungrouped fields — suggest `ScrollSpyTabs` or sectioning only when the schema genuinely has grouped sections (don't add tabs gratuitously).
- Long text in a table cell must be single-line via `AutoTooltip`, not wrapped.

### 5. Accessibility (usually the weakest area — look hard here)

- Icon-only buttons (`IconFont` / antd icon as the only child) need an accessible label (`aria-label` / `title`).
- Form fields need associated labels (`Form.Item label` / labeled `Input`), not a bare placeholder as the only cue.
- Interactive elements must be real buttons/links (keyboard-focusable), not `onClick` on a `div`/`span`.
- Drawers/modals should close on `Esc` and trap focus — the core-ui drawer/`FormDrawer` give this; a hand-rolled overlay won't.

### 6. Destructive actions

- Delete/remove goes through `DeleteModal` and is visually distinct from the primary action (never the same color/weight as a benign confirm).

### 7. Permissions & i18n

- Admin-only UI gated with `Access` / `useAccess` (ref `src/pages/access/index.tsx`), not just hidden by absence.
- `Select` options needing i18n: `label` set to the message key with `locale: true` on the option (ref `src/pages/benchmark/config/index.ts`). Don't ship raw English strings inline.

## Output format

Ranked list, most-severe first:

```
1. [semantic-color] table-list.tsx:82 — status rendered with antd <Tag color="red">.
   Principle: semantic color / consistency.
   Fix: use StatusTag with status mapped through StatusMaps.error and the state message.
```

End with a one-line verdict (e.g. "3 findings: 1 color, 2 a11y; layout & feedback are clean").

## Self-improvement (evolve this skill as you use it)

After each review, before finishing, ask: **did I rely on a rule, core-ui primitive, or violation class that isn't already in the checks above?**

- If yes, propose a concrete one-line addition to the relevant check (name the component/prop/path, keep it grounded in code that exists — verify the symbol before citing it). Show the user the proposed diff and let them approve; do not silently edit the skill.
- If the user corrects a finding ("that's not a real issue" / "you missed X"), treat that as the highest-value signal: fold the correction into the checks (or drop the false-positive rule) once approved.
- Keep both copies in sync — this open-source copy and the monorepo copy at `.claude/skills/design-review/SKILL.md` (repo root). When you add a rule to one, add the path-adjusted equivalent to the other.

Growth comes only through the user's approval — never auto-mutate the skill unreviewed.

## Related

- **create-crud-page** — the module structure and status-display setup this review checks against.
- **form-patterns** — cascading/dependent form fields.
- **dataviz** — for screens with charts, review color/legend/axis there instead.
