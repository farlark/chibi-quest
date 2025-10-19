// ============================================
// 遊戲常數配置
// ============================================

import type { ElementType } from '@/types';

// 屬性剋制倍率
export const ELEMENT_ADVANTAGE_MULTIPLIER = 1.3; // 剋制方
export const ELEMENT_DISADVANTAGE_MULTIPLIER = 0.7; // 被剋制方
export const LIGHT_DARK_MULTIPLIER = 1.5; // 光暗互剋

// 屬性剋制關係
export const ELEMENT_RELATIONSHIPS: Record<
  ElementType,
  { advantage: ElementType[]; disadvantage: ElementType[] }
> = {
  fire: { advantage: ['wind'], disadvantage: ['water'] },
  water: { advantage: ['fire'], disadvantage: ['wind'] },
  wind: { advantage: ['water'], disadvantage: ['fire'] },
  light: { advantage: ['dark'], disadvantage: ['dark'] },
  dark: { advantage: ['light'], disadvantage: ['light'] },
};

// 防禦計算常數 K 值
export const DEFENSE_CONSTANT = 500;
export const RESISTANCE_CONSTANT = 500;

// 爆擊基礎傷害倍率
export const BASE_CRIT_DAMAGE = 1.5; // 150%

// 地城適性加成
export const DUNGEON_AFFINITY_BONUS = {
  S: 0.2, // +20%
  A: 0.1, // +10%
  C: -0.1, // -10%
};

// 能量系統
export const MAX_ENERGY = 100;
export const ENERGY_PER_ACTION = 20; // 每次行動獲得的能量
export const ENERGY_PER_DAMAGED = 15; // 受到攻擊獲得的能量

// 隊伍限制
export const MIN_TEAM_SIZE = 1;
export const MAX_TEAM_SIZE = 6;
export const INITIAL_TEAM_SIZE = 3;
export const MAX_EVENT_CARDS = 6;

// 技能等級
export const MAX_SKILL_LEVEL = 3;

// 升級經驗值
export const EXP_PER_LEVEL = 100;
export const EXP_CURVE = 1.2; // 指數增長曲線

// 故事性數值
export const BASE_STORYNESS = 0;
export const MAX_STORYNESS = 100;
export const STORYNESS_DAMAGE_BONUS = 0.01; // 每點故事性增加1%傷害

// 戰鬥設定
export const MAX_COMBAT_TURNS = 50; // 最大回合數
export const BOSS_BATTLE_MAX_TURNS = 10; // Boss戰最大回合數

// UI相關
export const ANIMATION_DURATION = {
  damage: 500, // 傷害數字顯示時間
  ultimate: 2000, // 大招演出時間
  action: 300, // 一般行動動畫時間
};

// 稀有度顏色
export const RARITY_COLORS = {
  1: '#9CA3AF', // 灰色 - 普通
  2: '#10B981', // 綠色 - 稀有
  3: '#3B82F6', // 藍色 - 精英
  4: '#A855F7', // 紫色 - 史詩
  5: '#F59E0B', // 金色 - 傳說
};

// 元素顏色對應 (與 Tailwind config 一致)
export const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#FF6B35',
  water: '#4ECDC4',
  wind: '#95E1D3',
  light: '#FFE66D',
  dark: '#674188',
};

// CSV 檔案路徑
export const CSV_PATHS = {
  characters: '/data/characters.csv',
  events: '/data/events.csv',
  eventCards: '/data/eventCards.csv',
  dungeons: '/data/dungeons.csv',
  enemies: '/data/enemies.csv',
  skills: '/data/skills.csv',
  traits: '/data/traits.csv',
};

// 遊戲版本
export const GAME_VERSION = '0.0.1-prototype';

// Debug模式
export const DEBUG_MODE = import.meta.env.DEV;
