import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { scrollWhenSectionSettles } from '../section-navigation';

const globals = ['document', 'requestAnimationFrame', 'cancelAnimationFrame'];
const originalDescriptors = globals.map((key) =>
  Object.getOwnPropertyDescriptor(globalThis, key)
);
afterEach(() => {
  mock.restoreAll();
  globals.forEach((key, index) => {
    const descriptor = originalDescriptors[index];
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  });
});
const setGlobal = (key: string, value: unknown) =>
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value
  });

const setup = () => {
  const dom = new JSDOM(
    '<div class="ant-collapse-item"><div role="button" tabindex="0"><span id="gpu">GPU</span></div></div>'
  );
  setGlobal('document', dom.window.document);
  let height = 58;
  dom.window.document.querySelector(
    '.ant-collapse-item'
  )!.getBoundingClientRect = () => ({ height }) as DOMRect;
  const target = dom.window.document.getElementById('gpu')!;
  const scroll = mock.fn();
  target.scrollIntoView = scroll;
  const frames = new Map<number, FrameRequestCallback>();
  let nextId = 0;
  setGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextId, callback);
    return nextId;
  });
  setGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const tick = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(0));
  };
  return {
    dom,
    scroll,
    tick,
    resize: (next: number) => {
      height = next;
    }
  };
};

test('section navigation waits for expansion to settle before scrolling and focuses the header', () => {
  const page = setup();
  scrollWhenSectionSettles('gpu');
  for (const height of [58, 58, 150, 400, 700]) {
    page.resize(height);
    page.tick();
  }
  assert.equal(
    page.scroll.mock.callCount(),
    0,
    'do not scroll against the collapsed page length'
  );
  for (let frame = 0; frame < 4; frame++) page.tick();
  assert.equal(page.scroll.mock.callCount(), 1);
  assert.equal(
    page.dom.window.document.activeElement?.getAttribute('role'),
    'button'
  );
  page.dom.window.close();
});

test('a cancelled section jump cannot move focus or scroll after a later action', () => {
  const page = setup();
  const cancel = scrollWhenSectionSettles('gpu');
  page.tick();
  cancel();
  for (let frame = 0; frame < 8; frame++) page.tick();
  assert.equal(page.scroll.mock.callCount(), 0);
  page.dom.window.close();
});

test('a delayed opening panel cannot be mistaken for a settled collapsed page', () => {
  const page = setup();
  const item = page.dom.window.document.querySelector('.ant-collapse-item')!;
  const header = item.firstElementChild!;
  header.className = 'ant-collapse-header';
  header.setAttribute('aria-expanded', 'true');
  const content = page.dom.window.document.createElement('div');
  content.className = 'ant-collapse-panel';
  let contentHeight = 0;
  content.getBoundingClientRect = () => ({ height: contentHeight }) as DOMRect;
  item.appendChild(content);
  scrollWhenSectionSettles('gpu');
  for (let frame = 0; frame < 8; frame++) page.tick();
  assert.equal(page.scroll.mock.callCount(), 0);
  contentHeight = 600;
  page.resize(658);
  for (let frame = 0; frame < 5; frame++) page.tick();
  assert.equal(page.scroll.mock.callCount(), 1);
  page.dom.window.close();
});

test('collapsing content above the target must settle before the jump', () => {
  const page = setup();
  let top = 1000;
  page.dom.window.document.getElementById('gpu')!.getBoundingClientRect = () =>
    ({ top }) as DOMRect;
  scrollWhenSectionSettles('gpu');
  for (let frame = 0; frame < 4; frame++) {
    top -= 100;
    page.tick();
  }
  assert.equal(page.scroll.mock.callCount(), 0);
  top = 400;
  page.tick();
  assert.equal(page.scroll.mock.callCount(), 0);
  for (let frame = 0; frame < 4; frame++) page.tick();
  assert.equal(page.scroll.mock.callCount(), 1);
  page.dom.window.close();
});

test('overlay viewport alignment retries after a scroll is temporarily clamped', () => {
  const page = setup();
  const viewport = page.dom.window.document.createElement('div');
  viewport.setAttribute('data-overlayscrollbars-viewport', '');
  const item = page.dom.window.document.querySelector('.ant-collapse-item')!;
  item.parentElement!.appendChild(viewport);
  viewport.appendChild(item);
  let offset = 0,
    available = false;
  Object.defineProperty(viewport, 'scrollTop', {
    get: () => offset,
    set: (v) => {
      offset = available ? v : 0;
    }
  });
  viewport.getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
  const target = page.dom.window.document.getElementById('gpu')!;
  target.getBoundingClientRect = () => ({ top: 400 - offset }) as DOMRect;
  scrollWhenSectionSettles('gpu');
  for (let frame = 0; frame < 7; frame++) page.tick();
  assert.equal(offset, 0);
  available = true;
  for (let frame = 0; frame < 5; frame++) page.tick();
  assert.equal(offset, 400);
  page.dom.window.close();
});
