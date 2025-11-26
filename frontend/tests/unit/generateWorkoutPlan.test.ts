import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateWorkoutPlan } from '@/features/generator/engine';
import { UserPreferences } from '@/types/app';
import * as exerciseService from '@/services/exerciseService';

// Mock exerciseService
vi.mock('@/services/exerciseService');

describe('generateWorkoutPlan', () => {
  const mockExercises = [
    {
      id: '1',
      name: '伏地挺身',
      name_en: 'Push-up',
      description: '鍛鍊胸肌',
      video_url: 'https://example.com/pushup.mp4',
      duration_seconds: 30,
      target_muscles: ['chest'],
      training_goals: ['muscle'],
      difficulty: 'beginner',
      priority_weight: 8,
      equipment: [],
      is_active: true,
      tags: ['equipment:徒手', 'difficulty:初階', 'goal:增肌'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: '深蹲',
      name_en: 'Squat',
      description: '鍛鍊腿部',
      video_url: 'https://example.com/squat.mp4',
      duration_seconds: 45,
      target_muscles: ['legs'],
      training_goals: ['muscle'],
      difficulty: 'beginner',
      priority_weight: 9,
      equipment: [],
      is_active: true,
      tags: ['equipment:徒手', 'difficulty:初階', 'goal:增肌'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      name: '啞鈴彎舉',
      name_en: 'Dumbbell Curl',
      description: '鍛鍊手臂',
      video_url: 'https://example.com/curl.mp4',
      duration_seconds: 40,
      target_muscles: ['arms'],
      training_goals: ['muscle'],
      difficulty: 'intermediate',
      priority_weight: 7,
      equipment: ['dumbbell'],
      is_active: true,
      tags: ['equipment:啞鈴', 'difficulty:中階', 'goal:增肌'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.mocked(exerciseService.getAllExercises).mockResolvedValue(mockExercises);
  });

  it('應該根據使用者偏好生成訓練課表', async () => {
    const prefs: UserPreferences = {
      goal: 'muscle',
      equipment: ['bodyweight'],
      durationMinutes: 2, // 2 分鐘 = 120 秒
      difficulty: 'beginner',
    };

    const plan = await generateWorkoutPlan(prefs);

    expect(plan.length).toBeGreaterThan(0);
    expect(plan.every(item => item.duration > 0)).toBe(true);
    expect(plan.every(item => ['exercise', 'rest'].includes(item.type))).toBe(true);
  });

  it('應該在運動之間插入休息時間', async () => {
    const prefs: UserPreferences = {
      goal: 'muscle',
      equipment: ['bodyweight'],
      durationMinutes: 3,
      difficulty: 'beginner',
    };

    const plan = await generateWorkoutPlan(prefs);
    const restItems = plan.filter(item => item.type === 'rest');

    expect(restItems.length).toBeGreaterThan(0);
    expect(restItems.every(item => item.duration === 30)).toBe(true);
  });

  it('應該只選擇符合器材需求的運動', async () => {
    const prefs: UserPreferences = {
      goal: 'muscle',
      equipment: ['bodyweight'], // 只有徒手
      durationMinutes: 2,
      difficulty: 'beginner',
    };

    const plan = await generateWorkoutPlan(prefs);
    const exercises = plan.filter(item => item.type === 'exercise');

    // 所有運動都應該是徒手運動
    exercises.forEach(item => {
      if (item.exercise) {
        const eqTag = item.exercise.tags?.find(t => t.startsWith('equipment:'));
        expect(eqTag).toBe('equipment:徒手');
      }
    });
  });

  it('應該根據難度過濾運動', async () => {
    const prefs: UserPreferences = {
      goal: 'muscle',
      equipment: ['bodyweight', 'dumbbell'],
      durationMinutes: 2,
      difficulty: 'beginner', // 只要初階
    };

    const plan = await generateWorkoutPlan(prefs);
    const exercises = plan.filter(item => item.type === 'exercise');

    exercises.forEach(item => {
      if (item.exercise) {
        const diffTag = item.exercise.tags?.find(t => t.startsWith('difficulty:'));
        expect(diffTag).toBe('difficulty:初階');
      }
    });
  });

  it('當沒有符合條件的運動時應該使用 Fallback', async () => {
    const prefs: UserPreferences = {
      goal: 'muscle',
      equipment: ['kettlebell'], // 沒有壺鈴運動
      durationMinutes: 1,
      difficulty: 'advanced',
    };

    const plan = await generateWorkoutPlan(prefs);

    // 應該回傳徒手運動作為 Fallback
    expect(plan.length).toBeGreaterThan(0);
  });

  it('應該控制訓練總時長接近目標時間', async () => {
    const prefs: UserPreferences = {
      goal: 'muscle',
      equipment: ['bodyweight'],
      durationMinutes: 3, // 180 秒
      difficulty: 'beginner',
    };

    const plan = await generateWorkoutPlan(prefs);
    const totalDuration = plan.reduce((sum, item) => sum + item.duration, 0);

    // 總時長應該接近目標時間 (誤差在 60 秒內)
    expect(Math.abs(totalDuration - 180)).toBeLessThan(60);
  });
});
