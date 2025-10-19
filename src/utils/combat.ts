// ============================================
// 戰鬥系統邏輯
// ============================================

import type { CombatCharacter, CombatAction, CombatRewards, Skill, PositionType } from '@/types';
import {
  calculateBaseDamage,
  calculateFinalDamage,
  checkCritical,
  sortBySpeed,
} from './calculator';
import { ENERGY_PER_ACTION, ENERGY_PER_DAMAGED, MAX_ENERGY } from '@/config/constants';

/**
 * 執行一個完整的戰鬥回合
 * 返回該回合的所有行動記錄
 */
export function executeCombatTurn(
  playerTeam: CombatCharacter[],
  enemyTeam: CombatCharacter[],
  turnNumber: number
): {
  actions: CombatAction[];
  updatedPlayerTeam: CombatCharacter[];
  updatedEnemyTeam: CombatCharacter[];
} {
  const actions: CombatAction[] = [];
  let currentPlayerTeam = [...playerTeam];
  let currentEnemyTeam = [...enemyTeam];

  // 合併雙方隊伍並按速度排序
  const allCharacters = [
    ...currentPlayerTeam.map((c) => ({ character: c, isPlayer: true })),
    ...currentEnemyTeam.map((c) => ({ character: c, isPlayer: false })),
  ];

  const sortedCharacters = sortBySpeed(allCharacters.map((c) => c.character)).map((char) => {
    const info = allCharacters.find((c) => c.character.id === char.id)!;
    return info;
  });

  // 依序執行每個角色的行動
  for (const { character, isPlayer } of sortedCharacters) {
    // 檢查角色是否還活著
    if (character.currentHp <= 0) continue;

    const attackerTeam = isPlayer ? currentPlayerTeam : currentEnemyTeam;
    const defenderTeam = isPlayer ? currentEnemyTeam : currentPlayerTeam;

    // 檢查對方是否還有存活角色
    if (defenderTeam.filter((c) => c.currentHp > 0).length === 0) break;

    // 檢查是否能施放大招
    const canUseUltimate = character.currentEnergy >= character.maxEnergy;

    if (canUseUltimate) {
      // 施放大招
      const action = executeSkillAction(
        character,
        defenderTeam,
        character.ultimateSkill,
        turnNumber,
        isPlayer
      );
      actions.push(action);

      // 重置能量
      character.currentEnergy = 0;
    } else {
      // 普通攻擊
      const action = executeNormalAttack(character, defenderTeam, turnNumber, isPlayer);
      actions.push(action);

      // 增加能量
      character.currentEnergy = Math.min(
        character.maxEnergy,
        character.currentEnergy + ENERGY_PER_ACTION
      );
    }

    // 更新隊伍
    if (isPlayer) {
      currentPlayerTeam = [...attackerTeam];
      currentEnemyTeam = [...defenderTeam];
    } else {
      currentEnemyTeam = [...attackerTeam];
      currentPlayerTeam = [...defenderTeam];
    }
  }

  return {
    actions,
    updatedPlayerTeam: currentPlayerTeam,
    updatedEnemyTeam: currentEnemyTeam,
  };
}

/**
 * 執行普通攻擊
 */
function executeNormalAttack(
  attacker: CombatCharacter,
  defenders: CombatCharacter[],
  turn: number,
  isPlayer: boolean
): CombatAction {
  const target = selectTarget(defenders, attacker.position);
  if (!target) {
    return {
      turn,
      actorId: attacker.id,
      actorName: attacker.name,
      actionType: 'attack',
    };
  }

  const skill = attacker.normalSkill;
  return executeAttack(attacker, target, skill, turn, false);
}

/**
 * 執行技能攻擊
 */
function executeSkillAction(
  attacker: CombatCharacter,
  defenders: CombatCharacter[],
  skill: Skill,
  turn: number,
  isPlayer: boolean
): CombatAction {
  if (skill.targetType === 'all') {
    // AOE 攻擊
    return executeAOEAttack(attacker, defenders, skill, turn);
  } else if (skill.targetType === 'random') {
    // 隨機目標
    const aliveDefenders = defenders.filter((d) => d.currentHp > 0);
    const target = aliveDefenders[Math.floor(Math.random() * aliveDefenders.length)];
    return executeAttack(attacker, target, skill, turn, true);
  } else {
    // 單體目標
    const target = selectTarget(defenders, attacker.position);
    if (!target) {
      return {
        turn,
        actorId: attacker.id,
        actorName: attacker.name,
        actionType: 'ultimate',
      };
    }
    return executeAttack(attacker, target, skill, turn, true);
  }
}

/**
 * 執行單體攻擊
 */
function executeAttack(
  attacker: CombatCharacter,
  target: CombatCharacter,
  skill: Skill,
  turn: number,
  isUltimate: boolean
): CombatAction {
  const baseDamage = calculateBaseDamage(attacker, target, skill.multiplier);
  const isCritical = checkCritical(attacker.finalStats.critRate);
  const finalDamage = calculateFinalDamage(baseDamage, target, skill.damageType, isCritical);

  // 扣血
  target.currentHp = Math.max(0, target.currentHp - finalDamage);

  // 被攻擊者獲得能量
  if (target.currentHp > 0) {
    target.currentEnergy = Math.min(
      target.maxEnergy,
      target.currentEnergy + ENERGY_PER_DAMAGED
    );
  }

  return {
    turn,
    actorId: attacker.id,
    actorName: attacker.name,
    actionType: isUltimate ? 'ultimate' : 'attack',
    targetId: target.id,
    targetName: target.name,
    damage: finalDamage,
    isCritical,
  };
}

/**
 * 執行 AOE 攻擊
 */
function executeAOEAttack(
  attacker: CombatCharacter,
  defenders: CombatCharacter[],
  skill: Skill,
  turn: number
): CombatAction {
  const aliveDefenders = defenders.filter((d) => d.currentHp > 0);
  let totalDamage = 0;

  for (const target of aliveDefenders) {
    const baseDamage = calculateBaseDamage(attacker, target, skill.multiplier);
    const isCritical = checkCritical(attacker.finalStats.critRate);
    const finalDamage = calculateFinalDamage(baseDamage, target, skill.damageType, isCritical);

    target.currentHp = Math.max(0, target.currentHp - finalDamage);
    totalDamage += finalDamage;

    // 被攻擊者獲得能量
    if (target.currentHp > 0) {
      target.currentEnergy = Math.min(
        target.maxEnergy,
        target.currentEnergy + ENERGY_PER_DAMAGED
      );
    }
  }

  return {
    turn,
    actorId: attacker.id,
    actorName: attacker.name,
    actionType: 'ultimate',
    targetName: '全體敵人',
    damage: totalDamage,
    effects: [`攻擊了 ${aliveDefenders.length} 個目標`],
  };
}

/**
 * 選擇攻擊目標
 * 優先攻擊前排,如果前排全滅則攻擊後排
 */
function selectTarget(
  defenders: CombatCharacter[],
  attackerPosition: PositionType
): CombatCharacter | null {
  const aliveDefenders = defenders.filter((d) => d.currentHp > 0);
  if (aliveDefenders.length === 0) return null;

  // 優先選擇前排
  const frontLine = aliveDefenders.filter((d) => d.position === 'front');
  if (frontLine.length > 0) {
    // 隨機選擇一個前排目標
    return frontLine[Math.floor(Math.random() * frontLine.length)];
  }

  // 前排全滅,攻擊後排
  const backLine = aliveDefenders.filter((d) => d.position === 'back');
  if (backLine.length > 0) {
    return backLine[Math.floor(Math.random() * backLine.length)];
  }

  // 隨機選擇任意存活目標
  return aliveDefenders[Math.floor(Math.random() * aliveDefenders.length)];
}

/**
 * 檢查戰鬥是否結束
 */
export function checkBattleEnd(
  playerTeam: CombatCharacter[],
  enemyTeam: CombatCharacter[]
): { isFinished: boolean; winner?: 'player' | 'enemy' } {
  const playerAlive = playerTeam.filter((c) => c.currentHp > 0).length;
  const enemyAlive = enemyTeam.filter((c) => c.currentHp > 0).length;

  if (playerAlive === 0) {
    return { isFinished: true, winner: 'enemy' };
  }

  if (enemyAlive === 0) {
    return { isFinished: true, winner: 'player' };
  }

  return { isFinished: false };
}

/**
 * 計算戰鬥獎勵
 */
export function calculateCombatRewards(
  enemyTeam: CombatCharacter[],
  turnsTaken: number
): CombatRewards {
  // 基礎經驗值
  let exp = 50;

  // 根據敵人數量和等級計算獎勵
  enemyTeam.forEach((enemy) => {
    exp += enemy.level * 10;
  });

  // 快速通關獎勵
  if (turnsTaken <= 5) {
    exp = Math.floor(exp * 1.5);
  } else if (turnsTaken <= 10) {
    exp = Math.floor(exp * 1.2);
  }

  return {
    exp,
    gold: Math.floor(exp * 0.5),
  };
}

/**
 * 生成敵方隊伍 (用於冒險節點)
 */
export function generateEnemyTeam(
  level: number,
  count: number,
  baseCharacters: CombatCharacter[]
): CombatCharacter[] {
  const enemies: CombatCharacter[] = [];

  for (let i = 0; i < count; i++) {
    // 隨機選擇一個基礎角色作為模板
    const template = baseCharacters[Math.floor(Math.random() * baseCharacters.length)];

    // 複製並調整屬性 - 降低敵人強度
    const enemy: CombatCharacter = {
      ...JSON.parse(JSON.stringify(template)),
      id: `enemy_${Date.now()}_${i}`,
      level,
      position: i < 2 ? 'front' : 'back', // 前2個在前排
      currentHp: template.finalStats.hp * 0.7, // 降低70%血量
      currentEnergy: 0,
      maxEnergy: MAX_ENERGY,
      finalStats: {
        ...template.finalStats,
        hp: template.finalStats.hp * 0.7,
        atk: template.finalStats.atk * 0.6, // 降低攻擊力到60%
        def: template.finalStats.def * 0.5,
        res: template.finalStats.res * 0.5,
        spd: template.finalStats.spd * 0.8,
        critRate: template.finalStats.critRate * 0.5,
        critDmg: template.finalStats.critDmg,
      },
    };

    enemies.push(enemy);
  }

  return enemies;
}
