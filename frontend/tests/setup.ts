import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock import.meta.env for tests
vi.stubGlobal('import', {
  meta: {
    env: {
      MODE: 'test',
      VITE_SUPABASE_URL: 'https://mock.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'mock-key',
    },
  },
});

// 每個測試後清理
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
