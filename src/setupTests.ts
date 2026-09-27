import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { queryClient } from './queryClient';

// jsdom не має ResizeObserver, а графіки Recharts його використовують
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(() => {
  cleanup();
  // Кеш запитів спільний для всього застосунку — між тестами його треба чистити
  queryClient.clear();
  localStorage.clear();
  window.history.pushState({}, '', '/');
});
