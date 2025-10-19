// ============================================
// 冒險流程引擎
// ============================================

import type {
  Dungeon,
  AdventureNode,
  Team,
  CombatCharacter,
  CharacterCard,
  RandomEvent,
  LevelUpReward,
  Enemy,
} from '@/types';
import { ADVENTURE_NODE_CONFIG } from '@/config/gameConfig';
import { randomInt, weightedRandom, calculateExpRequirement } from './calculator';
import { generateEnemyTeam } from './combat';
import { MAX_ENERGY, EXP_PER_LEVEL, MAX_SKILL_LEVEL } from '@/config/constants';

/**
 * 生成冒險節點
 */
export function generateAdventureNodes(dungeon: Dungeon, teamLevel: number): AdventureNode[] {
  const nodes: AdventureNode[] = [];
  const { eventNodeChance } = ADVENTURE_NODE_CONFIG;

  // 使用地城設定的節點數量（不包含最後的 Boss 節點）
  const totalNodes = dungeon.numNodes - 1;

  for (let i = 0; i < totalNodes; i++) {
    // 決定是否為事件節點
    if (Math.random() < eventNodeChance) {
      nodes.push({
        id: `node_event_${i}`,
        type: 'event',
      });
    } else {
      nodes.push({
        id: `node_combat_${i}`,
        type: 'combat',
        enemies: [], // 將在實際遭遇時生成
      });
    }
  }

  // 最後一個節點是 Boss
  nodes.push({
    id: 'node_boss',
    type: 'boss',
    enemies: [], // Boss 將在實際遭遇時生成
  });

  return nodes;
}

/**
 * 生成節點的敵人
 */
export function generateNodeEnemies(
  nodeType: 'combat' | 'boss',
  teamLevel: number,
  baseCharacters: CharacterCard[]
): CombatCharacter[] {
  const enemyLevel = teamLevel + (nodeType === 'boss' ? 2 : 0);
  const enemyCount = nodeType === 'boss' ? randomInt(3, 4) : randomInt(2, 4);

  // 將 CharacterCard 轉換為 CombatCharacter
  const combatCharacters: CombatCharacter[] = baseCharacters.map((char) => ({
    ...char,
    position: 'front',
    currentHp: char.baseStats.hp,
    currentEnergy: 0,
    maxEnergy: MAX_ENERGY,
    finalStats: { ...char.baseStats },
    activeEffects: [],
    storyness: 0,
    traits: [],
  }));

  const enemies = generateEnemyTeam(enemyLevel, enemyCount, combatCharacters);

  // Boss 強化
  if (nodeType === 'boss') {
    enemies.forEach((enemy) => {
      enemy.finalStats.hp *= 2;
      enemy.finalStats.atk *= 1.5;
      enemy.currentHp = enemy.finalStats.hp;
    });
  }

  return enemies;
}

/**
 * 處理戰鬥勝利後的經驗值獲取
 */
export function gainExperience(
  team: Team,
  exp: number
): {
  leveledUp: boolean;
  newLevel: number;
  newExp: number;
  expNeeded: number;
} {
  const currentExp = team.teamExp + exp;
  const expNeeded = calculateExpRequirement(team.teamLevel);

  if (currentExp >= expNeeded) {
    // 升級
    return {
      leveledUp: true,
      newLevel: team.teamLevel + 1,
      newExp: currentExp - expNeeded,
      expNeeded: calculateExpRequirement(team.teamLevel + 1),
    };
  }

  return {
    leveledUp: false,
    newLevel: team.teamLevel,
    newExp: currentExp,
    expNeeded,
  };
}

/**
 * 生成升級獎勵選項 (三選一)
 */
export function generateLevelUpRewards(
  team: Team,
  availableRecruits: CharacterCard[],
  dungeonId: string
): LevelUpReward[] {
  const rewards: LevelUpReward[] = [];

  // 獎勵1: 招募新角色 (如果隊伍未滿)
  if (team.characters.length < 6 && availableRecruits.length > 0) {
    const recruitChar = availableRecruits[randomInt(0, availableRecruits.length - 1)];
    rewards.push({
      id: `reward_recruit_${Date.now()}`,
      type: 'recruit',
      recruit: recruitChar,
    });
  } else {
    // 如果隊伍滿了,給數值強化
    const randomChar = team.characters[randomInt(0, team.characters.length - 1)];
    rewards.push({
      id: `reward_stat_${Date.now()}`,
      type: 'stat_boost',
      statBoost: {
        characterId: randomChar.id,
        stats: {
          atk: randomInt(3, 8),
          hp: randomInt(10, 25),
        },
      },
    });
  }

  // 獎勵2 & 3: 技能升級或數值強化
  for (let i = 0; i < 2; i++) {
    const randomChar = team.characters[randomInt(0, team.characters.length - 1)];

    // 檢查是否有技能可以升級
    const canUpgradeNormal = randomChar.normalSkill.level < MAX_SKILL_LEVEL;
    const canUpgradeUltimate = randomChar.ultimateSkill.level < MAX_SKILL_LEVEL;

    if ((canUpgradeNormal || canUpgradeUltimate) && Math.random() < 0.6) {
      // 60% 機率技能升級
      const skillType = canUpgradeNormal && canUpgradeUltimate
        ? Math.random() < 0.5 ? 'normal' : 'ultimate'
        : canUpgradeNormal ? 'normal' : 'ultimate';

      const currentSkill = skillType === 'normal' ? randomChar.normalSkill : randomChar.ultimateSkill;

      rewards.push({
        id: `reward_skill_${Date.now()}_${i}`,
        type: 'skill_upgrade',
        skillUpgrade: {
          characterId: randomChar.id,
          skillType,
          level: currentSkill.level + 1,
        },
      });
    } else {
      // 數值強化
      rewards.push({
        id: `reward_stat_${Date.now()}_${i}`,
        type: 'stat_boost',
        statBoost: {
          characterId: randomChar.id,
          stats: {
            atk: randomInt(2, 6),
            hp: randomInt(8, 20),
            def: randomInt(1, 4),
          },
        },
      });
    }
  }

  return rewards;
}

/**
 * 應用升級獎勵
 */
export function applyLevelUpReward(
  team: Team,
  reward: LevelUpReward,
  allCharacters: CharacterCard[]
): Team {
  const updatedTeam = { ...team };

  switch (reward.type) {
    case 'recruit':
      if (reward.recruit && updatedTeam.characters.length < 6) {
        // 將新角色轉換為 CombatCharacter
        const newChar: CombatCharacter = {
          ...reward.recruit,
          position: updatedTeam.characters.length < 3 ? 'front' : 'back',
          currentHp: reward.recruit.baseStats.hp,
          currentEnergy: 0,
          maxEnergy: MAX_ENERGY,
          finalStats: { ...reward.recruit.baseStats },
          activeEffects: [],
          storyness: 0,
          traits: [],
        };
        updatedTeam.characters.push(newChar);
      }
      break;

    case 'skill_upgrade':
      if (reward.skillUpgrade) {
        const charIndex = updatedTeam.characters.findIndex(
          (c) => c.id === reward.skillUpgrade!.characterId
        );
        if (charIndex !== -1) {
          const char = updatedTeam.characters[charIndex];
          if (reward.skillUpgrade.skillType === 'normal') {
            char.normalSkill.level = reward.skillUpgrade.level;
            char.normalSkill.multiplier *= 1.2; // 每級增加20%倍率
          } else {
            char.ultimateSkill.level = reward.skillUpgrade.level;
            char.ultimateSkill.multiplier *= 1.25; // 每級增加25%倍率
          }
        }
      }
      break;

    case 'stat_boost':
      if (reward.statBoost) {
        const charIndex = updatedTeam.characters.findIndex(
          (c) => c.id === reward.statBoost!.characterId
        );
        if (charIndex !== -1) {
          const char = updatedTeam.characters[charIndex];
          // 直接增加 finalStats
          for (const [stat, value] of Object.entries(reward.statBoost.stats)) {
            (char.finalStats as any)[stat] += value;
          }
        }
      }
      break;
  }

  return updatedTeam;
}

/**
 * 選擇隨機事件
 */
export function selectRandomEvent(
  allEvents: RandomEvent[],
  teamStoryness: number
): RandomEvent | null {
  // 過濾出符合故事性要求的事件
  const availableEvents = allEvents.filter(
    (event) => !event.requireStoryness || teamStoryness >= event.requireStoryness
  );

  if (availableEvents.length === 0) return null;

  // 根據稀有度加權隨機
  const weights = availableEvents.map((event) => {
    // 稀有度越高,權重越低
    return Math.pow(0.5, event.rarity - 1);
  });

  return weightedRandom(availableEvents, weights);
}

/**
 * 將 CharacterCard 轉換為 CombatCharacter
 */
export function convertToCombatCharacter(
  card: CharacterCard,
  position: 'front' | 'back'
): CombatCharacter {
  return {
    ...card,
    position,
    currentHp: card.baseStats.hp,
    currentEnergy: 0,
    maxEnergy: MAX_ENERGY,
    finalStats: { ...card.baseStats },
    activeEffects: [],
    storyness: 0,
    traits: [],
  };
}

/**
 * 初始化冒險隊伍
 */
export function initializeAdventureTeam(
  selectedCharacters: CharacterCard[],
  selectedEventCards: any[],
  leaderId: string,
  dungeonId: string,
  characterPositions: Record<string, number>
): Team {
  // 按照站位排序角色，並確定前排/後排
  const sortedCharacters = selectedCharacters
    .map((char) => ({
      char,
      position: characterPositions[char.id] ?? 0,
    }))
    .sort((a, b) => a.position - b.position)
    .map(({ char, position }) =>
      // position 0-2 為前排，3-5 為後排
      convertToCombatCharacter(char, position < 3 ? 'front' : 'back')
    );

  const team: Team = {
    id: `team_${Date.now()}`,
    name: '冒險隊伍',
    characters: sortedCharacters,
    leaderId,
    eventCards: selectedEventCards,
    teamLevel: 1,
    teamExp: 0,
    teamStoryness: 0,
  };

  return team;
}
