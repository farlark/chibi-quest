// ============================================
// 遊戲配置 - 可調整的數值設定
// ============================================

import type { BaseStats } from '@/types';

// 初始玩家資源
export const INITIAL_RESOURCES = {
  gold: 1000,
  gems: 50,
};

// 預設角色基礎屬性 (用於測試或缺失數據時的後備)
export const DEFAULT_CHARACTER_STATS: BaseStats = {
  hp: 100,
  atk: 20,
  def: 10,
  res: 10,
  spd: 50,
  critRate: 0.05, // 5%
  critDmg: 1.5, // 150%
};

// 技能倍率預設值
export const DEFAULT_SKILL_MULTIPLIERS = {
  normal: 1.0, // 普通攻擊
  skill: 1.5, // 小招
  ultimate: 3.0, // 大招
};

// 升級獎勵權重配置
export const LEVEL_UP_REWARD_WEIGHTS = {
  recruit: 40, // 40% 機率招募
  skillUpgrade: 35, // 35% 機率技能升級
  statBoost: 25, // 25% 機率數值強化
};

// 隨機事件出現機率配置 (基於稀有度)
export const EVENT_RARITY_WEIGHTS = {
  1: 50, // 普通事件 50%
  2: 30, // 稀有事件 30%
  3: 15, // 精英事件 15%
  4: 4, // 史詩事件 4%
  5: 1, // 傳說事件 1%
};

// Boss 強化倍率
export const BOSS_STAT_MULTIPLIER = {
  hp: 5.0, // 血量 5倍
  atk: 1.5, // 攻擊 1.5倍
  def: 1.3, // 防禦 1.3倍
  res: 1.3, // 魔防 1.3倍
  spd: 1.0, // 速度不變
  critRate: 1.0,
  critDmg: 1.0,
};

// 冒險節點配置
export const ADVENTURE_NODE_CONFIG = {
  minCombatNodes: 5, // 最少戰鬥節點
  maxCombatNodes: 8, // 最多戰鬥節點
  eventNodeChance: 0.3, // 30% 機率出現事件節點
  restNodeChance: 0.1, // 10% 機率出現休息節點
};

// Final Boss 獎勵
export const FINAL_BOSS_REWARDS = {
  exp: 300,
  gold: 500,
  bonusPoints: 5, // 最終強化點數
};

// 數值強化範圍 (用於最終強化)
export const STAT_BOOST_RANGE = {
  hp: { min: 10, max: 30 },
  atk: { min: 3, max: 10 },
  def: { min: 2, max: 8 },
  res: { min: 2, max: 8 },
  spd: { min: 1, max: 5 },
  critRate: { min: 0.01, max: 0.05 },
  critDmg: { min: 0.05, max: 0.15 },
};

// 故事性事件加成
export const STORYNESS_EVENT_BONUS = {
  normal: 1, // 普通事件 +1
  rare: 3, // 稀有事件 +3
  epic: 5, // 史詩事件 +5
  legendary: 10, // 傳說事件 +10
};

// 站位配置
export const POSITION_CONFIG = {
  frontRowSize: 3, // 前排最多3人
  backRowSize: 3, // 後排最多3人
  frontRowTargetPriority: 0.7, // 70% 機率優先攻擊前排
};

// PVP 競技場配置 (預留)
export const PVP_CONFIG = {
  matchmakingRange: 200, // 匹配戰力範圍 ±200
  dailyAttempts: 5, // 每日挑戰次數
};

// PVE Boss 戰配置 (預留)
export const PVE_BOSS_CONFIG = {
  dailyAttempts: 3, // 每日挑戰次數
  damageRankingRewards: [
    { rank: 1, gold: 1000, gems: 50 },
    { rank: 10, gold: 500, gems: 20 },
    { rank: 50, gold: 200, gems: 10 },
  ],
};

// 角色成長率配置 (用於養成系統)
export const GROWTH_RATE_CONFIG = {
  minGrowthPercent: 0, // 最小成長率 0%
  maxGrowthPercent: 100, // 最大成長率 100%
  upgradePerLevel: 5, // 每次升級增加 5%
};

export default {
  INITIAL_RESOURCES,
  DEFAULT_CHARACTER_STATS,
  DEFAULT_SKILL_MULTIPLIERS,
  LEVEL_UP_REWARD_WEIGHTS,
  EVENT_RARITY_WEIGHTS,
  BOSS_STAT_MULTIPLIER,
  ADVENTURE_NODE_CONFIG,
  FINAL_BOSS_REWARDS,
  STAT_BOOST_RANGE,
  STORYNESS_EVENT_BONUS,
  POSITION_CONFIG,
  PVP_CONFIG,
  PVE_BOSS_CONFIG,
  GROWTH_RATE_CONFIG,
};
