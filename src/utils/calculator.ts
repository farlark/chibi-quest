// ============================================
// 數值計算引擎
// ============================================

import type { BaseStats, CombatCharacter, ElementType, Team, StatModifier } from '@/types';
import {
  ELEMENT_RELATIONSHIPS,
  ELEMENT_ADVANTAGE_MULTIPLIER,
  ELEMENT_DISADVANTAGE_MULTIPLIER,
  LIGHT_DARK_MULTIPLIER,
  DEFENSE_CONSTANT,
  RESISTANCE_CONSTANT,
  DUNGEON_AFFINITY_BONUS,
  STORYNESS_DAMAGE_BONUS,
} from '@/config/constants';

/**
 * 計算最終屬性
 * 公式: 最終屬性 = (基礎值 * (1 + 養成%) + 固定值強化) * (1 + 全局加成%)
 */
export function calculateFinalStats(
  character: CombatCharacter,
  team: Team,
  dungeonId?: string
): BaseStats {
  const baseStats = character.baseStats;
  const growthPercent = character.growthPercent / 100;

  // 計算全局加成百分比
  const globalModifiers = getGlobalModifiers(character, team, dungeonId);

  const finalStats: BaseStats = {
    hp: 0,
    atk: 0,
    def: 0,
    res: 0,
    spd: 0,
    critRate: 0,
    critDmg: 0,
  };

  // 計算每個屬性
  for (const key in baseStats) {
    const stat = key as keyof BaseStats;
    const base = baseStats[stat];

    // 基礎值 * (1 + 養成%)
    const withGrowth = base * (1 + growthPercent);

    // 應用全局加成
    const modifier = globalModifiers[stat] || 0;
    finalStats[stat] = withGrowth * (1 + modifier);
  }

  return finalStats;
}

/**
 * 獲取全局加成修改器
 */
function getGlobalModifiers(
  character: CombatCharacter,
  team: Team,
  dungeonId?: string
): Record<keyof BaseStats, number> {
  const modifiers: Record<keyof BaseStats, number> = {
    hp: 0,
    atk: 0,
    def: 0,
    res: 0,
    spd: 0,
    critRate: 0,
    critDmg: 0,
  };

  // 隊長技加成
  const leader = team.characters.find((c) => c.id === team.leaderId);
  if (leader?.leaderSkill) {
    applyStatModifiers(modifiers, leader.leaderSkill.effects, character);
  }

  // 事件卡加成
  team.eventCards.forEach((card) => {
    card.effects.forEach((effect) => {
      if (effect.type === 'stat_boost') {
        // 簡化處理: 假設 condition 格式為 "job:warrior:atk"
        const parts = effect.condition?.split(':');
        if (parts && parts.length === 3) {
          const [condType, condValue, stat] = parts;
          if (condType === 'job' && character.job === condValue) {
            modifiers[stat as keyof BaseStats] += parseFloat(effect.value as string) / 100;
          }
        }
      }
    });
  });

  // 特性/稱號加成
  character.traits.forEach((trait) => {
    applyStatModifiers(modifiers, trait.statModifiers, character);
  });

  // 地城適性加成
  if (dungeonId && character.dungeonAffinities[dungeonId]) {
    const affinity = character.dungeonAffinities[dungeonId];
    const bonus = DUNGEON_AFFINITY_BONUS[affinity];
    // 適性加成應用到所有屬性
    Object.keys(modifiers).forEach((key) => {
      modifiers[key as keyof BaseStats] += bonus;
    });
  }

  return modifiers;
}

/**
 * 應用數值修改器
 */
function applyStatModifiers(
  modifiers: Record<keyof BaseStats, number>,
  statModifiers: StatModifier[],
  character: CombatCharacter
) {
  statModifiers.forEach((modifier) => {
    // 檢查條件是否滿足
    if (modifier.condition) {
      const [condType, condValue] = modifier.condition.split(':');
      if (condType === 'element' && character.element !== condValue) return;
      if (condType === 'job' && character.job !== condValue) return;
    }

    if (modifier.stat === 'all') {
      // 應用到所有屬性
      Object.keys(modifiers).forEach((key) => {
        modifiers[key as keyof BaseStats] += modifier.value;
      });
    } else {
      modifiers[modifier.stat] += modifier.value;
    }
  });
}

/**
 * 計算屬性剋制倍率
 */
export function calculateElementMultiplier(
  attackerElement: ElementType,
  defenderElement: ElementType
): number {
  // 光暗互剋特殊處理
  if (
    (attackerElement === 'light' && defenderElement === 'dark') ||
    (attackerElement === 'dark' && defenderElement === 'light')
  ) {
    return LIGHT_DARK_MULTIPLIER;
  }

  const relationship = ELEMENT_RELATIONSHIPS[attackerElement];

  if (relationship.advantage.includes(defenderElement)) {
    return ELEMENT_ADVANTAGE_MULTIPLIER;
  }

  if (relationship.disadvantage.includes(defenderElement)) {
    return ELEMENT_DISADVANTAGE_MULTIPLIER;
  }

  return 1.0; // 無剋制關係
}

/**
 * 計算基礎傷害
 * 公式: 傷害 = 攻擊力 * 技能倍率 * 屬性剋制倍率 * (1 + 故事性加成%)
 */
export function calculateBaseDamage(
  attacker: CombatCharacter,
  defender: CombatCharacter,
  skillMultiplier: number
): number {
  const elementMultiplier = calculateElementMultiplier(attacker.element, defender.element);
  const storynessBonus = attacker.storyness * STORYNESS_DAMAGE_BONUS;

  const damage =
    attacker.finalStats.atk *
    skillMultiplier *
    elementMultiplier *
    (1 + storynessBonus);

  return damage;
}

/**
 * 計算防禦減傷率
 * 公式: 減傷率 = 防禦 / (防禦 + K)
 */
export function calculateDefenseReduction(defense: number, constant: number): number {
  return defense / (defense + constant);
}

/**
 * 計算最終承受傷害
 * 公式: 最終傷害 = 基礎傷害 * (1 - 防禦減傷率) * 爆擊倍率
 */
export function calculateFinalDamage(
  baseDamage: number,
  defender: CombatCharacter,
  damageType: 'physical' | 'magical',
  isCritical: boolean
): number {
  // 根據傷害類型選擇對應的防禦
  const defense = damageType === 'physical' ? defender.finalStats.def : defender.finalStats.res;
  const constant = damageType === 'physical' ? DEFENSE_CONSTANT : RESISTANCE_CONSTANT;

  const defenseReduction = calculateDefenseReduction(defense, constant);
  let damage = baseDamage * (1 - defenseReduction);

  // 爆擊處理
  if (isCritical) {
    damage *= defender.finalStats.critDmg;
  }

  // 確保至少造成1點傷害
  return Math.max(1, Math.floor(damage));
}

/**
 * 判斷是否爆擊
 */
export function checkCritical(critRate: number): boolean {
  return Math.random() < critRate;
}

/**
 * 計算戰力 (用於匹配和排名)
 */
export function calculatePower(character: CombatCharacter): number {
  const stats = character.finalStats;
  // 簡單的戰力計算公式
  return (
    stats.hp * 0.5 +
    stats.atk * 10 +
    stats.def * 5 +
    stats.res * 5 +
    stats.spd * 3 +
    stats.critRate * 1000 +
    stats.critDmg * 500 +
    character.storyness * 10
  );
}

/**
 * 計算隊伍總戰力
 */
export function calculateTeamPower(team: Team): number {
  return team.characters.reduce((total, char) => total + calculatePower(char), 0);
}

/**
 * 根據速度排序角色 (決定行動順序)
 */
export function sortBySpeed(characters: CombatCharacter[]): CombatCharacter[] {
  return [...characters].sort((a, b) => b.finalStats.spd - a.finalStats.spd);
}

/**
 * 計算經驗值需求
 */
export function calculateExpRequirement(level: number): number {
  // 簡單的指數增長曲線
  return Math.floor(100 * Math.pow(level, 1.2));
}

/**
 * 隨機選擇 (用於各種隨機事件)
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  return items[items.length - 1];
}

/**
 * 範圍內隨機數
 */
export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 隨機整數
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}
