import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllExercises } from '@/services/exerciseService';
import { supabase } from '@/lib/supabase';
import { MOCK_EXERCISES } from '@/data/mockExercises';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    supabaseUrl: 'https://mock.supabase.co',
  },
}));

// Mock data
vi.mock('@/data/mockExercises', () => ({
  MOCK_EXERCISES: [
    {
      id: '1',
      name: '測試運動',
      tags: ['equipment:徒手', 'difficulty:初階'],
    },
  ],
}));

describe('exerciseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllExercises', () => {
    it('應該成功從 Supabase 獲取運動資料', async () => {
      const mockData = [
        {
          id: '1',
          name: '伏地挺身',
          tags: ['equipment:徒手', 'difficulty:初階'],
        },
        {
          id: '2',
          name: '深蹲',
          tags: ['equipment:徒手', 'difficulty:初階'],
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      } as any);

      const result = await getAllExercises();

      expect(result).toEqual(mockData);
      expect(result.length).toBe(2);
      expect(supabase.from).toHaveBeenCalledWith('exercises');
    });

    it('應該在 Supabase 失敗時使用 Mock Data', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Network error', name: 'Error' },
        }),
      } as any);

      const result = await getAllExercises();

      expect(result).toEqual(MOCK_EXERCISES);
    });

    it('應該在資料庫為空時使用 Mock Data', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      const result = await getAllExercises();

      expect(result).toEqual(MOCK_EXERCISES);
    });

    it('應該清洗資料確保 tags 為陣列', async () => {
      const mockDataWithNullTags = [
        {
          id: '1',
          name: '伏地挺身',
          tags: null, // null tags
        },
        {
          id: '2',
          name: '深蹲',
          tags: undefined, // undefined tags
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockDataWithNullTags,
          error: null,
        }),
      } as any);

      const result = await getAllExercises();

      expect(result[0].tags).toEqual([]);
      expect(result[1].tags).toEqual([]);
      expect(Array.isArray(result[0].tags)).toBe(true);
    });
  });
});
