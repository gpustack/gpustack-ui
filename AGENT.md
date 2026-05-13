# React State and Request Patterns

These guidelines define preferred patterns for request handling, state updates, and side-effect management in React applications.

The primary goal is to keep data flow explicit, predictable, maintainable, and performant while avoiding unnecessary rerenders and effect-driven logic.

---

## 1. Avoid Effect-Driven Requests

Do not use request functions themselves as dependencies in `useEffect`.

Avoid patterns like:

```ts
useEffect(() => {
  fetchData();
}, [fetchData]);
```

Requests should be triggered explicitly by user actions or lifecycle entry points.

---

## 2. Form Requests Should Be Action-Driven

For form-related requests (such as loading `Select` options):

- Fetch data when the form is opened for the first time.
- If later requests depend on user interactions, trigger them directly inside the interaction handler.
- Do not rely on `useEffect` dependency changes to trigger requests.

Recommended:

```ts
const handleOnChange = (value) => {
  fetchData(value);
};
```

Avoid:

```ts
useEffect(() => {
  fetchData(value);
}, [value]);
```

The action itself should control the request.

---

## 3. Update Related States Together

If a single action updates multiple related states:

- Do not synchronize them through `useEffect`
- Do not derive them indirectly through `useMemo`

Instead, update all related states directly inside the action handler.

Recommended:

```ts
const handleOnChange = (value) => {
  setState1(...);
  setState2(...);
  buildState(...);
};
```

Avoid implicit state synchronization chains.

---

## 4. Group Strongly Related State

If multiple states are always updated together:

- Do not split them into multiple `useState` calls.
- Prefer a single state object.

Recommended:

```ts
const [state, setState] = useState({
  state1: ...,
  state2: ...,
  state3: ...,
});
```

This reduces unnecessary rerenders and keeps state transitions predictable.

---

## 5. Prefer Explicit State Flow

Avoid chaining business logic through multiple `useEffect` hooks.

Keep:

- request execution
- state updates
- derived calculations

close to the triggering action whenever possible.

Prefer:

```ts
const handleAction = () => {
  fetchData();
  setTableData(...);
  setSelectedRow(...);
};
```

Over:

```ts
useEffect(() => {
  buildTable();
}, [data]);

useEffect(() => {
  updateSelection();
}, [tableData]);
```

---

## 6. Avoid Premature Memoization

Do not use `useMemo` or `useCallback` unless there is a confirmed rendering or computation bottleneck.

Overusing memoization:

- increases complexity
- makes state flow harder to understand
- may introduce stale dependency issues

Prefer simple and explicit logic first.

Optimize only when necessary.

---

## 7. Keep Request Logic Predictable

A user interaction should clearly show:

- what request is triggered
- which states are updated
- how the UI changes

Avoid indirect update chains caused by dependency-driven effects.

The code should make the request and update flow easy to trace.

---

## 8. Prefer Action-Driven Architecture

Prefer:

- action-driven updates
- explicit handlers
- localized state transitions

Over:

- effect-driven synchronization
- cross-hook implicit updates
- reactive chains between states

The triggering action should remain the primary source of truth for UI updates.

---

# Form

Form-specific patterns that build on the rules above. The theme: keep cascading selections (pick A → derive B → write form) on a single, predictable path.

## 1. No Fallback for Derived Selection

When "pick A then auto-pick B", match by rule and return `undefined` if no match — let the corresponding form field stay empty.

Do not silently fall back to `list[0]` or another default. A fallback hides data issues and tricks the user into thinking they have a valid selection.

```ts
const findB = (key, list) =>
  key ? list.find((x) => x.key === key) : undefined;
```

For form fields, prefer clearing with `undefined` over `''`. With Ant Design, `undefined` restores the placeholder; `''` is treated as a real value.

## 2. Async Race Protection

For fetches triggered by a lifecycle entry (e.g., modal open), tag each invocation with a session ref. Discard stale results if the session has rotated (the modal was closed and re-opened) by the time the response arrives.

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

## 3. Reference Template

A typical form with two cascading selectors backed by a single shared state:

```ts
type Selection = { a?: string; b?: number };

const [selection, setSelection] = useState<Selection>({});
const sessionRef = useRef(0);

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
