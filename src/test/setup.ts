import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/dom';

configure({ asyncUtilTimeout: 5_000 });

// jsdom ships no IntersectionObserver; framer-motion's whileInView needs one. Report every
// observed element as visible so scroll-reveal sections render their final state under test.
class TestIntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: readonly number[] = [];
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
