import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils.ts', () => {
  it('cn should merge class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    expect(cn('px-2 py-1', undefined, null, false, 'text-sm')).toBe('px-2 py-1 text-sm');
    expect(cn('p-4', 'p-6')).toBe('p-6'); // tailwind-merge logic
  });
});
