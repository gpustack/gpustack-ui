---
name: form-patterns
description: Patterns for forms with cascading/dependent selections in the gpustack-ui monorepo. Use when building a form where picking one field derives another (pick A → auto-pick B → write form), handling async option loading on modal open, or protecting against stale async results.
---

# Form Patterns

Theme: keep cascading selections (pick A → derive B → write form) on a single, predictable path.

## Accessing the form: `form` vs `form.current`

This is **not** absolute — it depends on the call site:

- **Inside the form component** (`forms/index.tsx`), or anywhere holding a `Form.useForm()` instance → call it directly: `form.setFieldsValue(...)`.
- **In the outer Drawer/Modal wrapper** that opens the form and holds it via `ref={form}` (`const form = useRef(null)`), driven by an `open` prop → go through the ref: `form.current?.setFieldsValue(...)`.

The reference template below is written for the **Drawer-wrapper scenario** (it reacts to `open` and owns the shared `selection` state), so it uses `form.current?` throughout. If you lift this logic into the form body with a `useForm()` instance, drop the `.current`.

## 1. No fallback for derived selection

When "pick A then auto-pick B", match by rule and return `undefined` if no match — let the form field stay empty. Do **not** silently fall back to `list[0]`; a fallback hides data issues and fakes a valid selection.

```ts
const findB = (key, list) =>
  key ? list.find((x) => x.key === key) : undefined;
```

For form fields, clear with `undefined`, not `''`. In Ant Design `undefined` restores the placeholder; `''` is treated as a real value.

## 2. Async race protection

For fetches triggered by a lifecycle entry (e.g. modal open), tag each invocation with a session ref. Discard stale results if the session rotated (modal closed and re-opened) before the response arrives.

```ts
const sessionRef = useRef(0);

useEffect(() => {
  if (!open) {
    sessionRef.current += 1;
    return;
  }
  const session = ++sessionRef.current;
  Promise.all([fetchA(), fetchB()]).then(([as, bs]) => {
    if (sessionRef.current !== session) return;
    applySelection(as.items[0], findB(as.items[0].key, bs.items));
  });
}, [open]);
```

## 3. Reference template

Two cascading selectors backed by a single shared state, with a single atomic write (state + form together):

```ts
type Selection = { a?: string; b?: number };

const [selection, setSelection] = useState<Selection>({});
const sessionRef = useRef(0);
const form = useRef<any>(null); // wrapper holds the form via <Form ref={form} /> — see "Accessing the form" above

const findB = (key, list) =>
  key ? list.find((x) => x.key === key) : undefined;

// Single atomic write: state + form together.
const applySelection = (a, b) => {
  setSelection({ a: a.name, b: b?.id });
  form.current?.setFieldsValue({
    field: b?.field,
    spec: { ...currentSpec, ...b?.spec }
  });
};

// Trigger 1: modal opened
useEffect(() => {
  if (!open) {
    sessionRef.current++;
    setSelection({});
    return;
  }
  const session = ++sessionRef.current;
  Promise.all([fetchA(), fetchB()]).then(([as, bs]) => {
    if (sessionRef.current !== session) return;
    const first = as.items[0];
    applySelection(first, findB(first.key, bs.items));
  });
}, [open]);

// Trigger 2: user picks A
const handleAChange = (a) => {
  applySelection(a, findB(a.key, listB));
};

// Trigger 3: user picks B
const handleBChange = (b) => {
  setSelection((prev) => ({ ...prev, b: b.id }));
  form.current?.setFieldsValue({ ...b.fields });
};
```

## Related

- Module/file structure for forms lives in the **create-crud-page** skill (section 3).
- Required-field validation: use `getRuleMessage`.
