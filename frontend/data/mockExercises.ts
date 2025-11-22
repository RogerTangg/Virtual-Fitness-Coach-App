
import { Exercise } from '../types/db';

/**
 * 模擬運動資料庫 (Mock Data)
 * 確保在無後端連線時，App 仍能正常展示核心功能。
 * 包含多樣化的動作以測試篩選邏輯。
 */
export const MOCK_EXERCISES: Exercise[] = [
  // === 徒手 / 初階 ===
  {
    id: 'sq-001',
    name: '深蹲 (Squat)',
    description: '雙腳與肩同寬，臀部向後坐，保持背部挺直。大腿與地面平行後站起。',
    video_url: 'https://media.giphy.com/media/1qfKN8Dt0CRdCRzs9q/giphy.gif', // 範例 GIF
    duration_seconds: 45,
    tags: ['goal:增肌', 'goal:塑形', 'difficulty:初階', 'equipment:徒手', 'type:肌力']
  },
  {
    id: 'pu-001',
    name: '跪姿伏地挺身 (Knee Push-up)',
    description: '膝蓋著地，雙手撐地寬於肩。核心收緊，胸部貼近地面後推起。',
    video_url: 'https://media.giphy.com/media/S3n6idriKnbnm/giphy.gif',
    duration_seconds: 30,
    tags: ['goal:增肌', 'goal:塑形', 'difficulty:初階', 'equipment:徒手', 'type:肌力']
  },
  {
    id: 'jj-001',
    name: '開合跳 (Jumping Jacks)',
    description: '雙腳跳開同時雙手舉高，跳回時雙手放下。保持輕盈節奏。',
    video_url: 'https://media.giphy.com/media/l3vR8IAtvPQuDgOHu/giphy.gif',
    duration_seconds: 60,
    tags: ['goal:減脂', 'difficulty:初階', 'equipment:徒手', 'type:有氧']
  },
  {
    id: 'plank-001',
    name: '棒式 (Plank)',
    description: '前臂撐地，身體呈一直線。收緊腹部與臀部，保持呼吸。',
    video_url: 'https://media.giphy.com/media/xT8qBff8cRRFfCF2qA/giphy.gif',
    duration_seconds: 30,
    tags: ['goal:塑形', 'difficulty:初階', 'equipment:徒手', 'type:核心']
  },

  // === 徒手 / 中高階 ===
  {
    id: 'pu-002',
    name: '標準伏地挺身 (Push-up)',
    description: '雙腳打直，身體呈直線。胸部貼近地面，手肘向後45度。',
    video_url: 'https://media.giphy.com/media/3o6Zt5Z2W4R6v4J6da/giphy.gif',
    duration_seconds: 40,
    tags: ['goal:增肌', 'difficulty:中階', 'difficulty:高階', 'equipment:徒手', 'type:肌力']
  },
  {
    id: 'burpee-001',
    name: '波比跳 (Burpees)',
    description: '下蹲雙手撐地 -> 跳至棒式 -> 伏地挺身 -> 收腿 -> 垂直跳躍。',
    video_url: 'https://media.giphy.com/media/23hPPMRgPxbNefAGzL/giphy.gif',
    duration_seconds: 40,
    tags: ['goal:減脂', 'goal:增肌', 'difficulty:高階', 'equipment:徒手', 'type:高強度']
  },
  {
    id: 'lunge-001',
    name: '弓箭步 (Lunges)',
    description: '單腳向前跨步下蹲，雙膝呈90度。後腿膝蓋不觸地，輪流換腳。',
    video_url: 'https://media.giphy.com/media/l3q2Q3sUEk1d40nKS/giphy.gif',
    duration_seconds: 45,
    tags: ['goal:塑形', 'goal:增肌', 'difficulty:中階', 'equipment:徒手', 'type:肌力']
  },

  // === 啞鈴 (Dumbbell) ===
  {
    id: 'db-press-001',
    name: '啞鈴肩推 (DB Shoulder Press)',
    description: '手持啞鈴舉至肩部，向上推舉至手臂伸直，緩慢放下。',
    video_url: 'https://media.giphy.com/media/3o7TKy3K9wZ2p66vTy/giphy.gif',
    duration_seconds: 45,
    tags: ['goal:增肌', 'difficulty:中階', 'equipment:啞鈴', 'type:肌力']
  },
  {
    id: 'db-row-001',
    name: '啞鈴划船 (DB Row)',
    description: '一手支撐，另一手持啞鈴。背部挺直，將手肘向後拉起啞鈴。',
    video_url: 'https://media.giphy.com/media/3o7TKVpC5qJ7y3q7gA/giphy.gif',
    duration_seconds: 45,
    tags: ['goal:增肌', 'goal:塑形', 'difficulty:中階', 'equipment:啞鈴', 'type:肌力']
  },
  {
    id: 'db-goblet-001',
    name: '高腳杯深蹲 (Goblet Squat)',
    description: '雙手捧住一個啞鈴置於胸前，進行深蹲動作。',
    video_url: 'https://media.giphy.com/media/3o7TKM8v9v9q5z9q0U/giphy.gif',
    duration_seconds: 45,
    tags: ['goal:增肌', 'difficulty:中階', 'equipment:啞鈴', 'type:肌力']
  },

  // === 彈力帶 (Band) ===
  {
    id: 'band-pull-001',
    name: '彈力帶面拉 (Face Pull)',
    description: '將彈力帶拉向臉部，手肘向外打開，感受後肩收縮。',
    video_url: 'https://media.giphy.com/media/3o7TKsQ8f9q5z9q0U/giphy.gif',
    duration_seconds: 40,
    tags: ['goal:塑形', 'difficulty:初階', 'equipment:彈力帶', 'type:肌力']
  }
];
