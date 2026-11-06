import { JSDOM } from 'jsdom';

export function createTestDOM() {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  for (const name of [
    'window',
    'document',
    'navigator',
    'HTMLElement',
    'HTMLAnchorElement',
    'Element',
    'Node',
    'SVGElement',
    'ShadowRoot',
    'MutationObserver',
    'getComputedStyle',
    'File',
    'Blob'
  ] as const) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value: name === 'window' ? dom.window : dom.window[name]
    });
  }
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
    configurable: true,
    value: true
  });
  dom.window.matchMedia = (media) => ({
    matches: false,
    media,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false
  });
  return dom;
}

// Control the browser I/O boundary while exercising the real Upload and Form.
export class ControlledFileReader {
  static instances: ControlledFileReader[] = [];
  result: string | null = null;
  error: Error | null = null;
  file?: File;
  onload?: () => void;
  onerror?: () => void;
  constructor() {
    ControlledFileReader.instances.push(this);
  }
  readAsDataURL(file: File) {
    this.file = file;
  }
  succeed(value: string) {
    this.result = value;
    this.onload?.();
  }
  fail() {
    this.error = new Error('Unreadable file');
    this.onerror?.();
  }
}

export const flushEvents = () =>
  new Promise<void>((resolve) => setImmediate(resolve));
